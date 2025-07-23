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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Brain, 
  Plus, 
  Search, 
  RefreshCw,
  Filter,
  BarChart3,
  Layers,
  Zap,
  LineChart,
  BarChart,
  Network,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive
} from 'lucide-react';
import { mlAPI } from '@/lib/api';

interface Model {
  id: string;
  name: string;
  description: string;
  model_type: string;
  algorithm: string;
  status: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  mse?: number;
  mae?: number;
  created_at: string;
}

export default function ModelsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadModels();
    }
  }, [user]);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await mlAPI.getAllModels();
      setModels(response.data);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const getModelIcon = (modelType: string, algorithm: string) => {
    switch (modelType.toLowerCase()) {
      case 'classification':
        return algorithm.includes('forest') ? 
          <Layers className="h-5 w-5 text-green-500" /> : 
          <Network className="h-5 w-5 text-blue-500" />;
      case 'regression':
        return <LineChart className="h-5 w-5 text-purple-500" />;
      case 'clustering':
        return <BarChart className="h-5 w-5 text-yellow-500" />;
      default:
        return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'trained':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'training':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'deployed':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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

  const getAccuracyMetric = (model: Model) => {
    if (model.model_type === 'classification') {
      return model.accuracy !== undefined ? 
        { name: 'Accuracy', value: (model.accuracy * 100).toFixed(1) + '%' } : 
        { name: 'F1 Score', value: model.f1_score !== undefined ? (model.f1_score * 100).toFixed(1) + '%' : 'N/A' };
    } else if (model.model_type === 'regression') {
      return model.mse !== undefined ? 
        { name: 'MSE', value: model.mse.toFixed(4) } : 
        { name: 'MAE', value: model.mae !== undefined ? model.mae.toFixed(4) : 'N/A' };
    }
    return { name: 'Score', value: 'N/A' };
  };

  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.algorithm.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Models</h1>
                <p className="mt-2 text-gray-600">
                  Manage and deploy your machine learning models
                </p>
              </div>
              <Button onClick={() => router.push('/models/train')}>
                <Plus className="h-4 w-4 mr-2" />
                Train New Model
              </Button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={loadModels} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredModels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModels.map((model) => {
                  const metric = getAccuracyMetric(model);
                  return (
                    <Link href={`/models/${model.id}`} key={model.id}>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <CardTitle className="flex items-center">
                                {getModelIcon(model.model_type, model.algorithm)}
                                <span className="ml-2">{model.name}</span>
                              </CardTitle>
                              <CardDescription>
                                {model.description || 'No description provided'}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={model.status === 'trained' || model.status === 'deployed' ? 'default' : 'outline'} 
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(model.status)}
                              <span>{model.status}</span>
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">Algorithm</span>
                                <span className="font-medium">{model.algorithm}</span>
                              </div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">Type</span>
                                <span className="font-medium capitalize">{model.model_type}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{metric.name}</span>
                                <span className="font-medium">{metric.value}</span>
                              </div>
                            </div>
                            
                            {model.accuracy !== undefined && (
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Performance</span>
                                  <span>{(model.accuracy * 100).toFixed(1)}%</span>
                                </div>
                                <Progress value={model.accuracy * 100} className="h-1.5" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4 text-xs text-gray-500">
                          Created {formatDate(model.created_at)}
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'No models match your search criteria' : 'Train your first model to get started'}
                </p>
                <Button onClick={() => router.push('/models/train')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Train New Model
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 