'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Brain, 
  ArrowLeft, 
  LineChart, 
  BarChart, 
  Network,
  RefreshCw,
  Layers,
  AlertCircle
} from 'lucide-react';
import { datasetsAPI, mlAPI } from '@/lib/api';

interface Dataset {
  id: string;
  name: string;
  file_type: string;
  column_count?: number;
  row_count?: number;
  schema?: any;
}

const modelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  dataset_id: z.string().min(1, 'Dataset is required'),
  model_type: z.enum(['classification', 'regression', 'clustering']),
  algorithm: z.string().min(1, 'Algorithm is required'),
  target_column: z.string().optional(),
  hyperparameters: z.record(z.any()).optional(),
});

type ModelForm = z.infer<typeof modelSchema>;

export default function TrainModelPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [modelType, setModelType] = useState<'classification' | 'regression' | 'clustering'>('classification');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ModelForm>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      model_type: 'classification',
      hyperparameters: {},
    },
  });

  const watchDatasetId = watch('dataset_id');
  const watchModelType = watch('model_type');
  const watchAlgorithm = watch('algorithm');

  useEffect(() => {
    if (user) {
      loadDatasets();
    }
  }, [user]);

  useEffect(() => {
    if (watchDatasetId && watchDatasetId !== 'none') {
      const dataset = datasets.find(d => d.id === watchDatasetId);
      setSelectedDataset(dataset || null);
      
      // Extract columns from dataset schema if available
      if (dataset?.schema) {
        const columnNames = Object.keys(dataset.schema);
        setColumns(columnNames);
      } else {
        setColumns([]);
      }
    } else {
      setSelectedDataset(null);
      setColumns([]);
    }
  }, [watchDatasetId, datasets]);

  useEffect(() => {
    // Reset algorithm when model type changes
    setValue('algorithm', '');
  }, [watchModelType, setValue]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const response = await datasetsAPI.getAll();
      setDatasets(response.data);
    } catch (error) {
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const getAlgorithmOptions = () => {
    switch (modelType) {
      case 'classification':
        return [
          { value: 'random_forest', label: 'Random Forest' },
          { value: 'logistic_regression', label: 'Logistic Regression' },
          { value: 'svm', label: 'Support Vector Machine' },
        ];
      case 'regression':
        return [
          { value: 'random_forest', label: 'Random Forest' },
          { value: 'linear_regression', label: 'Linear Regression' },
          { value: 'svr', label: 'Support Vector Regression' },
        ];
      case 'clustering':
        return [
          { value: 'kmeans', label: 'K-Means' },
          { value: 'dbscan', label: 'DBSCAN' },
          { value: 'hierarchical', label: 'Hierarchical Clustering' },
        ];
      default:
        return [];
    }
  };

  const getHyperparameterFields = () => {
    if (!watchAlgorithm) return null;

    const hyperparameterConfig: Record<string, { type: string, label: string, default: any, min?: number, max?: number }> = {
      // Classification
      random_forest: {
        n_estimators: { type: 'number', label: 'Number of Trees', default: 100, min: 10, max: 1000 },
        max_depth: { type: 'number', label: 'Maximum Depth', default: 10, min: 1, max: 100 },
        min_samples_split: { type: 'number', label: 'Min Samples Split', default: 2, min: 2, max: 20 },
      },
      logistic_regression: {
        C: { type: 'number', label: 'Regularization Strength (C)', default: 1.0, min: 0.1, max: 10 },
        max_iter: { type: 'number', label: 'Maximum Iterations', default: 100, min: 50, max: 1000 },
      },
      svm: {
        C: { type: 'number', label: 'Regularization Strength (C)', default: 1.0, min: 0.1, max: 10 },
        kernel: { type: 'select', label: 'Kernel', default: 'rbf', options: ['linear', 'poly', 'rbf', 'sigmoid'] },
      },
      // Regression
      linear_regression: {
        fit_intercept: { type: 'boolean', label: 'Fit Intercept', default: true },
      },
      svr: {
        C: { type: 'number', label: 'Regularization Strength (C)', default: 1.0, min: 0.1, max: 10 },
        kernel: { type: 'select', label: 'Kernel', default: 'rbf', options: ['linear', 'poly', 'rbf', 'sigmoid'] },
      },
      // Clustering
      kmeans: {
        n_clusters: { type: 'number', label: 'Number of Clusters', default: 3, min: 2, max: 20 },
        init: { type: 'select', label: 'Initialization Method', default: 'k-means++', options: ['k-means++', 'random'] },
      },
      dbscan: {
        eps: { type: 'number', label: 'Epsilon', default: 0.5, min: 0.1, max: 10 },
        min_samples: { type: 'number', label: 'Minimum Samples', default: 5, min: 2, max: 20 },
      },
      hierarchical: {
        n_clusters: { type: 'number', label: 'Number of Clusters', default: 3, min: 2, max: 20 },
        linkage: { type: 'select', label: 'Linkage', default: 'ward', options: ['ward', 'complete', 'average', 'single'] },
      },
    };

    const algorithmParams = hyperparameterConfig[watchAlgorithm] || {};
    
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Hyperparameters</h3>
        {Object.entries(algorithmParams).map(([param, config]) => (
          <div key={param} className="space-y-2">
            <Label htmlFor={param}>{config.label}</Label>
            {config.type === 'number' && (
              <Input
                id={param}
                type="number"
                defaultValue={config.default}
                min={config.min}
                max={config.max}
                step={0.1}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setValue(`hyperparameters.${param}`, value);
                }}
              />
            )}
            {config.type === 'select' && (
              <Select 
                defaultValue={config.default} 
                onValueChange={(value) => setValue(`hyperparameters.${param}`, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${config.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {config.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {config.type === 'boolean' && (
              <Select 
                defaultValue={config.default ? 'true' : 'false'} 
                onValueChange={(value) => setValue(`hyperparameters.${param}`, value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    );
  };

  const onSubmit = async (data: ModelForm) => {
    try {
      setTraining(true);
      toast.info('Starting model training...');
      
      // Prepare model configuration
      const modelConfig = {
        name: data.name,
        description: data.description || '',
        model_type: data.model_type,
        algorithm: data.algorithm,
        target_column: data.target_column,
        hyperparameters: data.hyperparameters || {},
      };
      
      // Train model
      const response = await mlAPI.trainModel(data.dataset_id, modelConfig);
      
      toast.success('Model training initiated successfully!');
      
      // Redirect to model detail page
      router.push(`/models/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to train model');
    } finally {
      setTraining(false);
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
        <main className="flex-1 pt-24 p-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center mb-8">
              <Button variant="ghost" onClick={() => router.push('/models')} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Train New Model</h1>
                <p className="mt-2 text-gray-600">
                  Configure and train a machine learning model on your dataset
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Provide basic details about your model
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Model Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter a name for your model"
                        {...register('name')}
                        disabled={training}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter a description for your model"
                        {...register('description')}
                        disabled={training}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dataset Selection</CardTitle>
                    <CardDescription>
                      Select a dataset to train your model on
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataset">Dataset</Label>
                      <Select 
                        value={watchDatasetId} 
                        onValueChange={(value) => setValue('dataset_id', value)}
                        disabled={training || datasets.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dataset" />
                        </SelectTrigger>
                        <SelectContent>
                          {datasets.length > 0 ? (
                            datasets.map((dataset) => (
                              <SelectItem key={dataset.id} value={dataset.id}>
                                {dataset.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No datasets available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors.dataset_id && (
                        <p className="text-sm text-red-500">{errors.dataset_id.message}</p>
                      )}
                      {datasets.length === 0 && !loading && (
                        <p className="text-sm text-amber-600 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          You need to upload a dataset first
                        </p>
                      )}
                    </div>

                    {selectedDataset && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="font-medium text-gray-900 mb-2">Dataset Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">File Type:</span>
                            <span className="ml-2 font-medium uppercase">{selectedDataset.file_type}</span>
                          </div>
                          {selectedDataset.row_count && (
                            <div>
                              <span className="text-gray-500">Rows:</span>
                              <span className="ml-2 font-medium">{selectedDataset.row_count.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedDataset.column_count && (
                            <div>
                              <span className="text-gray-500">Columns:</span>
                              <span className="ml-2 font-medium">{selectedDataset.column_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Model Configuration</CardTitle>
                    <CardDescription>
                      Configure your machine learning model
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="classification" onValueChange={(value) => {
                      setModelType(value as any);
                      setValue('model_type', value as any);
                    }}>
                      <TabsList className="grid grid-cols-3 mb-6">
                        <TabsTrigger value="classification" disabled={training} className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          Classification
                        </TabsTrigger>
                        <TabsTrigger value="regression" disabled={training} className="flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          Regression
                        </TabsTrigger>
                        <TabsTrigger value="clustering" disabled={training} className="flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          Clustering
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="algorithm">Algorithm</Label>
                          <Select 
                            value={watchAlgorithm} 
                            onValueChange={(value) => setValue('algorithm', value)}
                            disabled={training}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an algorithm" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAlgorithmOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.algorithm && (
                            <p className="text-sm text-red-500">{errors.algorithm.message}</p>
                          )}
                        </div>
                        
                        {(modelType === 'classification' || modelType === 'regression') && columns.length > 0 && (
                          <div className="space-y-2">
                            <Label htmlFor="target_column">Target Column</Label>
                            <Select 
                              onValueChange={(value) => setValue('target_column', value)}
                              disabled={training}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select target column" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map((column) => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {watchAlgorithm && getHyperparameterFields()}
                      </div>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push('/models')}
                      disabled={training}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={training || !watchDatasetId || !watchAlgorithm}
                      className="min-w-[120px]"
                    >
                      {training ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Training...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Train Model
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
} 