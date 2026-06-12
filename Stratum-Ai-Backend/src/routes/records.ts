import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { createSalesforceRecord, updateSalesforceRecord } from '../services/salesforceService.js';
import { getSalesforceConnection } from '../services/supabaseService.js';
import { logger } from '../lib/logger.js';

const router = Router();

const ALLOWED_OBJECTS = ['Lead', 'Contact', 'Account', 'Opportunity', 'Task', 'Case'] as const;
type AllowedObject = typeof ALLOWED_OBJECTS[number];

const createRecordSchema = z.object({
  objectType: z.enum(ALLOWED_OBJECTS),
  fields: z.record(z.unknown()).refine((f) => Object.keys(f).length > 0, {
    message: 'At least one field is required',
  }),
});

const updateRecordSchema = z.object({
  fields: z.record(z.unknown()).refine((f) => Object.keys(f).length > 0, {
    message: 'At least one field is required',
  }),
});

router.post(
  '/',
  requireAuth,
  validate(createRecordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const { objectType, fields } = req.body as z.infer<typeof createRecordSchema>;

      const connection = await getSalesforceConnection(sub);
      if (!connection) throw new AppError(400, 'Salesforce not connected. Please connect your org in Settings.');

      const result = await createSalesforceRecord(sub, objectType as AllowedObject, fields);
      logger.info({ userId: sub, objectType, recordId: result.id }, 'Salesforce record created via API');

      res.status(201).json({
        success: true,
        data: { id: result.id, objectType, message: `${objectType} created successfully` },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:objectType/:recordId',
  requireAuth,
  validate(updateRecordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const objectType = String(req.params['objectType'] ?? '');
      const recordId = String(req.params['recordId'] ?? '');
      const { fields } = req.body as z.infer<typeof updateRecordSchema>;

      if (!ALLOWED_OBJECTS.includes(objectType as AllowedObject)) {
        throw new AppError(400, `Invalid object type: ${objectType}`);
      }

      const connection = await getSalesforceConnection(sub);
      if (!connection) throw new AppError(400, 'Salesforce not connected. Please connect your org in Settings.');

      await updateSalesforceRecord(sub, objectType as AllowedObject, recordId, fields);
      logger.info({ userId: sub, objectType, recordId }, 'Salesforce record updated via API');

      res.json({
        success: true,
        data: { id: recordId, objectType, message: `${objectType} updated successfully` },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
