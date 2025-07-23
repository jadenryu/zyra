'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const onSubmit = async (data: LoginForm) => {
    console.log('Form submitted with data:', data);
    setShowErrors(true);
    setIsLoading(true);
    
    try {
      await login(data.email, data.password);
      toast.success('Successfully logged in!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log('Form validation errors:', errors);
    setShowErrors(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M8 6h16v4H8V6zM6 12h20v4H6v-4zM4 18h24v4H4v-4zM6 24h20v2H6v-2z"
                  fill="currentColor"
                />
                <circle cx="26" cy="8" r="2" fill="currentColor" opacity="0.7" />
                <circle cx="28" cy="14" r="2" fill="currentColor" opacity="0.7" />
                <circle cx="30" cy="20" r="2" fill="currentColor" opacity="0.7" />
              </svg>
            </div>
          </div>
          <h2 className="heading-2 text-foreground">Sign in to Zyra</h2>
          <p className="mt-2 text-muted">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="heading-3">Sign In</CardTitle>
            <CardDescription className="text-muted">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={`${showErrors && errors.email ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-brand-500 focus:border-brand-500'} bg-background text-foreground`}
                />
                {showErrors && errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className={`${showErrors && errors.password ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-brand-500 focus:border-brand-500'} bg-background text-foreground pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {showErrors && errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="btn-primary w-full" 
                disabled={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 