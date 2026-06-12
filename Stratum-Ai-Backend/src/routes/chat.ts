import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { processChat } from '../services/aiService.js';
import {
  createSalesforceRecord,
  updateSalesforceRecord,
} from '../services/salesforceService.js';
import {
  createConversation,
  getConversations,
  getMessages,
  createMessage,
  getConversationById,
  updateConversationTitle,
  deleteConversation,
  getUserSettings,
} from '../services/supabaseService.js';
import type { Message } from '../types/shared.js';

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(4000, 'Message too long'),
  conversation_id: z.string().uuid().optional(),
});

const updateTitleSchema = z.object({
  title: z.string().min(1).max(255),
});

// ✅ Schema for confirming a pending create or update action
const executeActionSchema = z.object({
  conversation_id: z.string().uuid(),
  type: z.enum(['create', 'update']),
  object: z.string().min(1),
  fields: z.record(z.unknown()),
  recordId: z.string().optional(),
});

router.get(
  '/conversations',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const conversations = await getConversations(sub);
      res.json({ success: true, data: { conversations } });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/conversations',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const conversation = await createConversation(sub);
      res.status(201).json({ success: true, data: { conversation } });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/conversations/:id/messages',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const { id } = req.params as { id: string };
      const messages = await getMessages(id, sub);
      res.json({ success: true, data: { messages } });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/conversations/:id',
  requireAuth,
  validate(updateTitleSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const { id } = req.params as { id: string };
      const { title } = req.body as z.infer<typeof updateTitleSchema>;
      await updateConversationTitle(id, sub, title);
      res.json({ success: true, message: 'Conversation updated' });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/conversations/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const { id } = req.params as { id: string };
      await deleteConversation(id, sub);
      res.json({ success: true, message: 'Conversation deleted' });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/send',
  requireAuth,
  chatRateLimiter,
  validate(sendMessageSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const { content, conversation_id } = req.body as z.infer<typeof sendMessageSchema>;

      let conversationId = conversation_id;
      let conversation = conversationId
        ? await getConversationById(conversationId, sub)
        : null;

      if (!conversation) {
        conversation = await createConversation(sub);
        conversationId = conversation.id;
      }

      const userMessage: Message = await createMessage({
        conversationId: conversationId!,
        role: 'user',
        content,
      });

      const history = (await getMessages(conversationId!, sub))
        .filter((m) => m.id !== userMessage.id)
        .slice(-20)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const settings = await getUserSettings(sub);

      // ✅ Fixed: use a current supported model as default
      const preferredModel = settings?.preferred_ai_model ?? 'llama-3.3-70b-versatile';

      if (!settings) {
        throw new AppError(500, 'User settings not found');
      }

      const startTime = Date.now();
      const chatResult = await processChat({
        userId: sub,
        userMessage: content,
        conversationHistory: history,
        preferredModel,
      });

      const metadata = {
        ai_model: chatResult.aiModel,
        sf_object: chatResult.sfObject,
        sf_operation: chatResult.sfOperation,
        api_calls: chatResult.apiCalls,
        processing_time_ms: Date.now() - startTime,
        pending_action: chatResult.pendingAction,
      };

      const assistantMessage = await createMessage({
        conversationId: conversationId!,
        role: 'assistant',
        content: chatResult.content,
        metadata,
      });

      if (conversation.title === null && content.length > 0) {
        const autoTitle = content.slice(0, 60) + (content.length > 60 ? '...' : '');
        await updateConversationTitle(conversationId!, sub, autoTitle).catch(() => undefined);
      }

      res.json({
        success: true,
        data: {
          message: assistantMessage,
          conversation,
          transparency: settings.show_api_transparency ? metadata : undefined,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ✅ New route: executes a confirmed pending create or update action
router.post(
  '/execute',
  requireAuth,
  validate(executeActionSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const { conversation_id, type, object, fields, recordId } =
        req.body as z.infer<typeof executeActionSchema>;

      // Verify conversation belongs to user
      const conversation = await getConversationById(conversation_id, sub);
      if (!conversation) {
        throw new AppError(404, 'Conversation not found');
      }

      let resultMessage: string;

      if (type === 'create') {
        const result = await createSalesforceRecord(sub, object, fields);
        resultMessage = `${object} record created successfully with ID: \`${result.id}\``;
      } else if (type === 'update') {
        if (!recordId) {
          throw new AppError(400, 'recordId is required for update actions');
        }
        await updateSalesforceRecord(sub, object, recordId, fields);
        resultMessage = `${object} record \`${recordId}\` updated successfully`;
      } else {
        throw new AppError(400, 'Invalid action type');
      }

      // Save the result as an assistant message in the conversation
      const assistantMessage = await createMessage({
        conversationId: conversation_id,
        role: 'assistant',
        content: resultMessage,
        metadata: {
          sf_object: object,
          sf_operation: type,
          ai_model: 'system',
          api_calls: [{ object, operation: type, ...(recordId ? { record_id: recordId } : {}) }],
        },
      });

      res.json({
        success: true,
        data: { message: assistantMessage },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;