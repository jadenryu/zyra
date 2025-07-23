'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Database, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileJson, 
  FileText,
  BarChart3,
  RefreshCw,
  Filter
} from 'lucide-react';
import { datasetsAPI } from '@/lib/api';

interface Dataset {
  id: string;
  name: string;
  description: string;
  file_type: string;
  file_size: number;
  created_at: string;
  row_count?: number;
  column_count?: number;
}

export default function DatasetsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadDatasets();
    }
  }, [user]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const response = await datasetsAPI.getAll();
      setDatasets(response.data);
    } catch (error) {
      console.error('Failed to load datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'csv':
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'json':
        return <FileJson className="h-5 w-5 text-yellow-500" />;
      case 'parquet':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    dataset.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-3xl font-bold text-gray-900">Datasets</h1>
                <p className="mt-2 text-gray-600">
                  Manage and analyze your datasets
                </p>
              </div>
              <Link href="/datasets/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Dataset
                </Button>
              </Link>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search datasets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={loadDatasets} disabled={loading}>
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
            ) : filteredDatasets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDatasets.map((dataset) => (
                  <Link href={`/datasets/${dataset.id}/analyze`} key={dataset.id}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center">
                              {getFileIcon(dataset.file_type)}
                              <span className="ml-2">{dataset.name}</span>
                            </CardTitle>
                            <CardDescription>
                              {dataset.description || 'No description provided'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="uppercase">
                            {dataset.file_type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex justify-between">
                            <span>Size:</span>
                            <span className="font-medium">{formatFileSize(dataset.file_size)}</span>
                          </div>
                          {dataset.row_count && (
                            <div className="flex justify-between">
                              <span>Rows:</span>
                              <span className="font-medium">{dataset.row_count.toLocaleString()}</span>
                            </div>
                          )}
                          {dataset.column_count && (
                            <div className="flex justify-between">
                              <span>Columns:</span>
                              <span className="font-medium">{dataset.column_count}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span className="font-medium">{formatDate(dataset.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'No datasets match your search criteria' : 'Upload your first dataset to get started'}
                </p>
                <Link href="/datasets/upload">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Dataset
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 