'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const redirectMap: Record<string, string> = {
  ADMIN: '/admin',
  HOST: '/host',
  HOD: '/hod',
  PRINCIPAL: '/principal',
  STUDENT: '/student',
};

const demoAccounts = [
  // {
  //   role: 'Admin',
  //   email: 'admin@demo.com',
  //   password: 'Demo@123',
  // },
  {
    role: 'Student',
    email: 'chavanaryan58@gmail.com',
    password: 'pass@123',
  },
  {
    role: 'Host',
    email: 's@gmail.com',
    password: 'pass@123',
  },
  {
    role: 'HOD',
    email: 'ss@gmail.com',
    password: 'pass@123',
  },
  {
    role: 'Principal',
    email: 'narkhede@gmail.com',
    password: 'pass@123',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    // Wait a moment for session cookie to be set
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Keep trying to get session up to 5 times
    let session = null;
    for (let i = 0; i < 5; i++) {
      const res = await fetch('/api/auth/session');
      session = await res.json();
      if (session?.user?.role) break;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    if (!session?.user?.role) {
      setError('Session error. Please try again.');
      setLoading(false);
      return;
    }

    if (session.user.isFirstLogin) {
      router.push('/change-password');
      return;
    }

    const destination = redirectMap[session.user.role] ?? '/login';
    window.location.href = destination;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding with Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0">
          <Image
            src="/login.png"
            alt="MET Campus"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 text-white text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-white/30 shadow-2xl overflow-hidden p-2">
              <Link href="/">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-white/30 shadow-2xl overflow-hidden p-2 cursor-pointer">
                  <Image
                    src="/logo.png"
                    alt="MET Logo"
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
            EventSphere
          </h1>
          <p className="text-lg text-white/90 leading-relaxed mb-8 font-medium drop-shadow-md">
            MET&apos;s Institute of Technology
          </p>
          <div className="w-16 h-1 bg-white/50 mx-auto mb-8 rounded-full shadow-lg" />
          <p className="text-sm text-white/80 leading-relaxed font-medium drop-shadow-md">
            Streamline your college events from proposal to final report with
            automated approvals, guest management, and comprehensive reporting.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">
                Event<span className="text-primary">Sphere</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              MET&apos;s Institute of Technology
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full h-12 mb-4 rounded-xl">
                Show Test Credentials
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Demo Accounts</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                {demoAccounts.map((account) => (
                  <div
                    key={account.role}
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                      setOpen(false);
                    }}
                    className="rounded-lg border p-3 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div className="font-semibold text-primary">
                      {account.role}
                    </div>

                    <div className="text-sm mt-1">
                      <strong>Email:</strong> {account.email}
                    </div>

                    <div className="text-sm">
                      <strong>Password:</strong> {account.password}
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      Click to autofill login form
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Card className="border-border/50 shadow-xl shadow-black/5">
            <CardHeader className="space-y-1 pb-4">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to your EventSphere dashboard
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@met.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl px-4 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl px-4 pr-12 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 text-center border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Contact your administrator if you need access credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
