'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Folder,
  Database,
  BarChart3,
  Brain,
  RefreshCw,
  FileText,
  Plus,
  Trash2,
  Edit,
  Clock,
  Calendar,
  User
} from 'lucide-react';
import { projectsAPI, datasetsAPI, mlAPI } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
  model_type: string;
  algorithm: string;
  status: string;
  created_at: string;
}

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && projectId) {
      loadProjectData();
    }
  }, [user, projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Load project details
      const projectResponse = await projectsAPI.getById(projectId);
      setProject(projectResponse.data);
      
      // Load datasets for this project
      const datasetsResponse = await datasetsAPI.getAll({ project_id: parseInt(projectId) });
      setDatasets(datasetsResponse.data);
      
      // Load models for this project
      const modelsResponse = await mlAPI.getAllModels({ project_id: parseInt(projectId) });
      setModels(modelsResponse.data);
    } catch (error) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="heading-2 mb-4">Please sign in to continue</h1>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 pt-24 p-8 ml-64">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center mb-8 gap-6">
                <Link href="/projects" className="btn-secondary p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="animate-pulse w-64 h-8 bg-muted rounded"></div>
              </div>
              
              <div className="grid gap-6">
                <div className="professional-card animate-pulse">
                  <div className="space-y-4">
                    <div className="h-5 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-16 bg-muted rounded"></div>
                      <div className="h-16 bg-muted rounded"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 pt-24 p-8 ml-64">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center mb-8 gap-6">
                <Link href="/projects" className="btn-secondary p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </div>
              
              <div className="professional-card text-center py-16">
                <div className="icon-container bg-muted mx-auto mb-6">
                  <Folder className="h-8 w-8 text-muted" />
                </div>
                <h3 className="heading-3 mb-2">Project not found</h3>
                <p className="text-muted mb-6">The project you're looking for doesn't exist or has been deleted.</p>
                <Link href="/projects" className="btn-primary">
                  Back to Projects
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pt-24 p-8 ml-64">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href="/projects" className="btn-secondary p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="heading-1 flex items-center gap-3">
                    <div className="icon-container brand">
                      <Folder className="h-6 w-6" />
                    </div>
                    {project.name}
                  </h1>
                  <p className="text-large text-muted">{project.description || 'No description provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={loadProjectData} disabled={loading} className="btn-secondary p-2">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <Link href={`/datasets/upload?project=${projectId}`} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dataset
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 mb-8 md:grid-cols-3">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container brand">
                    <Database className="w-5 h-5" />
                  </div>
                </div>
                <div className="stat-value">{datasets.length}</div>
                <p className="stat-label">Datasets</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container brand">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="stat-value">0</div>
                <p className="stat-label">Analyses</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container brand">
                    <Brain className="w-5 h-5" />
                  </div>
                </div>
                <div className="stat-value">{models.length}</div>
                <p className="stat-label">Models</p>
              </div>
            </div>

            {/* Project Details */}
            <div className="professional-card mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-3">Project Information</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center text-sm text-muted mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created
                  </div>
                  <p className="font-medium">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <div className="flex items-center text-sm text-muted mb-2">
                    <Clock className="h-4 w-4 mr-2" />
                    Last Updated
                  </div>
                  <p className="font-medium">{formatDate(project.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="datasets">Datasets ({datasets.length})</TabsTrigger>
                <TabsTrigger value="models">Models ({models.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Recent Datasets */}
                  <div className="professional-card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="heading-3">Recent Datasets</h3>
                      <Link href={`/datasets/upload?project=${projectId}`} className="text-brand-600 hover:text-brand-700 font-medium text-sm">
                        Add Dataset
                      </Link>
                    </div>
                    {datasets.length > 0 ? (
                      <div className="space-y-3">
                        {datasets.slice(0, 3).map((dataset) => (
                          <div key={dataset.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="icon-container brand">
                                <Database className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{dataset.name}</p>
                                <p className="text-sm text-muted">{formatFileSize(dataset.file_size)}</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted">{formatDate(dataset.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Database className="h-8 w-8 text-muted mx-auto mb-3" />
                        <p className="text-muted">No datasets yet</p>
                      </div>
                    )}
                  </div>

                  {/* Recent Models */}
                  <div className="professional-card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="heading-3">Recent Models</h3>
                      <Link href="/models/train" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
                        Train Model
                      </Link>
                    </div>
                    {models.length > 0 ? (
                      <div className="space-y-3">
                        {models.slice(0, 3).map((model) => (
                          <div key={model.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="icon-container brand">
                                <Brain className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{model.name}</p>
                                <p className="text-sm text-muted">{model.algorithm}</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted">{formatDate(model.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="h-8 w-8 text-muted mx-auto mb-3" />
                        <p className="text-muted">No models yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="datasets">
                <div className="professional-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="heading-3">Datasets</h3>
                    <Link href={`/datasets/upload?project=${projectId}`} className="btn-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Dataset
                    </Link>
                  </div>
                  {datasets.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {datasets.map((dataset) => (
                        <div key={dataset.id} className="border border-border rounded-lg p-4 hover:bg-accent transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="icon-container brand">
                              <Database className="h-5 w-5" />
                            </div>
                          </div>
                          <h4 className="font-semibold mb-1">{dataset.name}</h4>
                          <p className="text-sm text-muted mb-3">{dataset.description || 'No description'}</p>
                          <div className="flex items-center justify-between text-sm text-muted">
                            <span>{formatFileSize(dataset.file_size)}</span>
                            <span>{formatDate(dataset.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Database className="h-12 w-12 text-muted mx-auto mb-4" />
                      <h4 className="heading-3 mb-2">No datasets</h4>
                      <p className="text-muted mb-6">Upload your first dataset to get started with analysis.</p>
                      <Link href={`/datasets/upload?project=${projectId}`} className="btn-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Dataset
                      </Link>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="models">
                <div className="professional-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="heading-3">Models</h3>
                    <Link href="/models/train" className="btn-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Train Model
                    </Link>
                  </div>
                  {models.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {models.map((model) => (
                        <div key={model.id} className="border border-border rounded-lg p-4 hover:bg-accent transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="icon-container brand">
                              <Brain className="h-5 w-5" />
                            </div>
                          </div>
                          <h4 className="font-semibold mb-1">{model.name}</h4>
                          <p className="text-sm text-muted mb-3">{model.description || 'No description'}</p>
                          <div className="flex items-center justify-between text-sm text-muted">
                            <span>{model.algorithm}</span>
                            <span>{formatDate(model.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Brain className="h-12 w-12 text-muted mx-auto mb-4" />
                      <h4 className="heading-3 mb-2">No models</h4>
                      <p className="text-muted mb-6">Train your first model to start making predictions.</p>
                      <Link href="/models/train" className="btn-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Train Model
                      </Link>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
} 