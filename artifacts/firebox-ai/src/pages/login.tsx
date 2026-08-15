import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Zap, Mail, Lock, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      setLocation('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-sidebar-foreground mb-6">
            <span className="flex size-10 items-center justify-center rounded-[10px] bg-primary text-white">
              <Zap size={20} strokeWidth={2.8} />
            </span>
            <span className="font-serif text-xl font-bold tracking-[-.04em]">
              firebox<span className="text-primary">.</span>ai
            </span>
          </Link>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h1 className="font-serif text-2xl font-bold tracking-[-.04em] mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your workspace</p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-105 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowUpRight size={14} />}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Don't have an account?</span>
            <Link href="/signup" className="text-xs font-bold text-primary hover:underline">
              Sign up
            </Link>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
            <p className="text-[11px] font-semibold text-primary mb-1">Demo Credentials</p>
            <p className="text-[10px] text-muted-foreground">
              Email: <span className="font-mono text-foreground">demo@fireboxai.dev</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Password: <span className="font-mono text-foreground">demo123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
