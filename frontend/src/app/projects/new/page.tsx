'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Folder,
  RefreshCw,
} from 'lucide-react';
import { projectsAPI } from '@/lib/api';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectForm) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const response = await projectsAPI.create({
        name: data.name,
        description: data.description || '',
      });
      
      toast.success('Project created successfully!');
      router.push(`/projects/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please sign in to continue</h1>
          <Button className="mt-4" onClick={() => router.push('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center mb-8 gap-6">
              <Button variant="ghost" onClick={() => router.push('/projects')} className="p-2">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
                <p className="mt-2 text-gray-600">
                  Create a new project to organize your datasets and analyses
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Folder className="h-5 w-5 text-blue-500 mr-2" />
                    Project Details
                  </CardTitle>
                  <CardDescription>
                    Enter information about your new project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter project name"
                      {...register('name')}
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter project description"
                      {...register('description')}
                      disabled={isSubmitting}
                      rows={4}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push('/projects')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
} 