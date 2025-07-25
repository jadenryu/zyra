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

const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  fullName: z.string().min(1, 'Full name is required').min(2, 'Full name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const onSubmit = async (data: RegisterForm) => {
    setShowErrors(true);
    setIsLoading(true);
    
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
      });
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errors: any) => {
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
          <h2 className="heading-2 text-foreground">Create your account</h2>
          <p className="mt-2 text-muted">
            Start your data analysis journey with Zyra
          </p>
        </div>

        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="heading-3">Sign Up</CardTitle>
            <CardDescription className="text-muted">
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  {...register('fullName')}
                  className={`${showErrors && errors.fullName ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-brand-500 focus:border-brand-500'} bg-background text-foreground`}
                />
                {showErrors && errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

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
                    placeholder="Create a password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className={`${showErrors && errors.confirmPassword ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-brand-500 focus:border-brand-500'} bg-background text-foreground pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {showErrors && errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="btn-primary w-full" 
                disabled={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 