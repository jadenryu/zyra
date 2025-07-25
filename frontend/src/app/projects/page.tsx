'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';
import { 
  FileText, 
  Plus, 
  Search, 
  RefreshCw,
  Filter,
  Calendar,
  Database,
  BarChart3,
  MoreHorizontal,
  Folder,
  Clock
} from 'lucide-react';
import { projectsAPI } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  dataset_count?: number;
  analysis_count?: number;
  model_count?: number;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="heading-2 mb-4">Please sign in to continue</h1>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn(
          "flex-1 pt-20 p-8 pb-20 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-screen",
          isCollapsed ? "ml-[70px]" : "ml-[280px]"
        )}>
          <div className="mx-auto max-w-7xl">
            {/* Header Section */}
            <div className="flex justify-between items-start mt-16 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-black mb-2">Projects</h1>
                <p className="text-lg text-black">
                  Manage your data analysis projects and track their progress
                </p>
              </div>
              <Link 
                href="/projects/new" 
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Link>
            </div>

            {/* Search Section */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>
              <button 
                className="inline-flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={loadProjects} 
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="professional-card animate-pulse">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-lg"></div>
                        <div className="h-5 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-12 bg-muted rounded"></div>
                        <div className="h-12 bg-muted rounded"></div>
                        <div className="h-12 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="professional-card cursor-pointer group" onClick={() => router.push(`/projects/${project.id}`)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="icon-container brand">
                          <Folder className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="heading-3 group-hover:text-brand-600 transition-colors">{project.name}</h3>
                          <p className="text-sm text-black mt-1">
                            {project.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 bg-brand-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Database className="h-4 w-4 text-brand-600 mr-1" />
                          <span className="font-semibold text-foreground">{project.dataset_count || 0}</span>
                        </div>
                        <p className="text-xs text-black">Datasets</p>
                      </div>
                      <div className="text-center p-3 bg-brand-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <BarChart3 className="h-4 w-4 text-brand-600 mr-1" />
                          <span className="font-semibold text-foreground">{project.analysis_count || 0}</span>
                        </div>
                        <p className="text-xs text-black">Analyses</p>
                      </div>
                      <div className="text-center p-3 bg-brand-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <FileText className="h-4 w-4 text-brand-600 mr-1" />
                          <span className="font-semibold text-foreground">{project.model_count || 0}</span>
                        </div>
                        <p className="text-xs text-black">Models</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-black border-t border-border pt-4">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/datasets/upload?project=${project.id}`);
                          }}
                          className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                        >
                          Add Dataset
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="professional-card text-center py-16">
                <div className="icon-container bg-muted mx-auto mb-6">
                  <Folder className="h-8 w-8 text-black" />
                </div>
                <h3 className="heading-3 mb-2">No projects found</h3>
                <p className="text-black mb-6 max-w-md mx-auto">
                  {searchTerm ? 'No projects match your search criteria. Try adjusting your search terms.' : 'Create your first project to get started with data analysis.'}
                </p>
                <Link href="/projects/new" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 