import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import StratumLogo from '@/components/shared/StratumLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { MOCK_EMAIL, MOCK_PASSWORD } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ email, password });
      navigate('/connect');
    } catch (err) {
      toast({
        title: 'Sign in failed',
        description: err instanceof Error ? err.message : 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  const fillDemo = () => {
    setEmail(MOCK_EMAIL);
    setPassword(MOCK_PASSWORD);
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

        {/* Demo credentials banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
          style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)' }}
        >
          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#3B82F6' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: '#3B82F6' }}>Demo account</p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-secondary)' }}>
                {MOCK_EMAIL}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {MOCK_PASSWORD}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 text-xs h-7 px-3"
            style={{ borderColor: 'rgba(59,130,246,0.4)', color: '#3B82F6' }}
            onClick={fillDemo}
          >
            Use demo
          </Button>
        </motion.div>

        <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }} className="rounded-xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Welcome back
            </CardTitle>
            <CardDescription style={{ color: 'var(--text-secondary)' }}>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <CardContent className="space-y-4">
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
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full text-white font-semibold"
                style={{ background: '#3B82F6' }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</>
                ) : 'Sign In →'}
              </Button>
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                Don&apos;t have an account?{' '}
                <Button variant="link" className="p-0 h-auto text-sm" style={{ color: '#3B82F6' }} asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
