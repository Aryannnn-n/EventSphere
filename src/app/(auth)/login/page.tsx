'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const redirectMap: Record<string, string> = {
  ADMIN: '/admin',
  HOST: '/host',
  HOD: '/hod',
  PRINCIPAL: '/principal',
  STUDENT: '/student',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">EventSphere</CardTitle>
          <p className="text-gray-500 text-sm">
            MET&apos;s Institute of Technology
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@met.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
