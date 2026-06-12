import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import StratumLogo from '@/components/shared/StratumLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegister } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    try {
      await registerMutation.mutateAsync({ email, password });
      navigate('/connect');
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Could not create account',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <StratumLogo size="lg" />
        </div>

        <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }} className="rounded-xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Create your account
            </CardTitle>
            <CardDescription style={{ color: 'var(--text-secondary)' }}>
              Start connecting your CRM data with AI
            </CardDescription>
          </CardHeader>

          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: 'var(--text-primary)' }}>Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: 'var(--text-primary)' }}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: 'var(--text-primary)' }}>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pl-9 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" style={{ color: 'var(--text-primary)' }}>Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={showCf ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pl-9 pr-10"
                  />
                  <button type="button" onClick={() => setShowCf((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full text-white font-semibold"
                style={{ background: '#3B82F6' }}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account...</>
                ) : 'Create Account →'}
              </Button>
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <Button variant="link" className="p-0 h-auto text-sm" style={{ color: '#3B82F6' }} asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
