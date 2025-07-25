'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Zap,
  Brain,
  Target,
  Settings,
  FileText,
  PieChart,
  Scatter3D,
  MessageSquare
} from 'lucide-react';
import { datasetsAPI, dataProcessingAPI, analyticsAPI } from '@/lib/api';
import { Chat } from '@/components/ui/chat';

interface Dataset {
  id: string;
  name: string;
  description: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface DataQuality {
  quality_score: number;
  missing_data_percentage: number;
  duplicate_rows: number;
  completeness: number;
}

interface OutlierInfo {
  method: string;
  outliers_by_column: Record<string, any>;
  total_outliers: number;
  recommendations: string[];
}

interface FeatureSuggestions {
  encoding_suggestions: any[];
  scaling_suggestions: any[];
  feature_creation_suggestions: any[];
  missing_value_suggestions: any[];
  transformation_suggestions: any[];
}

export default function DatasetAnalyzePage() {
  const params = useParams();
  const datasetId = params.id as string;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  
  // Analysis results
  const [comprehensiveReport, setComprehensiveReport] = useState<any>(null);
  const [outlierInfo, setOutlierInfo] = useState<OutlierInfo | null>(null);
  const [featureSuggestions, setFeatureSuggestions] = useState<FeatureSuggestions | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [selectedVisualization, setSelectedVisualization] = useState<any>(null);
  
  // Form states
  const [outlierMethod, setOutlierMethod] = useState('iqr');
  const [targetColumn, setTargetColumn] = useState('');
  const [chartType, setChartType] = useState('histogram');
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');

  useEffect(() => {
    loadDataset();
  }, [datasetId]);

  const loadDataset = async () => {
    try {
      const response = await datasetsAPI.getById(datasetId);
      setDataset(response.data);
      
      // Auto-generate dashboard on load
      await generateDashboard();
    } catch (error: any) {
      toast.error('Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  const generateComprehensiveReport = async () => {
    setAnalysisLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/data/datasets/${datasetId}/comprehensive-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          include_plots: true,
          target_column: targetColumn || null
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');
      
      const data = await response.json();
      setComprehensiveReport(data);
      toast.success('Comprehensive report generated!');
    } catch (error: any) {
      toast.error('Failed to generate comprehensive report');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const detectOutliers = async () => {
    setAnalysisLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/data/datasets/${datasetId}/detect-outliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ method: outlierMethod })
      });

      if (!response.ok) throw new Error('Failed to detect outliers');
      
      const data = await response.json();
      setOutlierInfo(data);
      toast.success('Outlier detection completed!');
    } catch (error: any) {
      toast.error('Failed to detect outliers');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getFeatureSuggestions = async () => {
    setAnalysisLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/data/datasets/${datasetId}/feature-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ target_column: targetColumn || null })
      });

      if (!response.ok) throw new Error('Failed to get feature suggestions');
      
      const data = await response.json();
      setFeatureSuggestions(data);
      toast.success('Feature engineering suggestions generated!');
    } catch (error: any) {
      toast.error('Failed to get feature suggestions');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const generateDashboard = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/data/datasets/${datasetId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (!response.ok) throw new Error('Failed to generate dashboard');
      
      const data = await response.json();
      setDashboard(data);
    } catch (error: any) {
      toast.error('Failed to generate dashboard');
    }
  };

  const createVisualization = async () => {
    setAnalysisLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/data/datasets/${datasetId}/visualize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          chart_type: chartType,
          x_column: xColumn || null,
          y_column: yColumn || null,
          title: `${chartType} of ${xColumn}${yColumn ? ` vs ${yColumn}` : ''}`
        })
      });

      if (!response.ok) throw new Error('Failed to create visualization');
      
      const data = await response.json();
      setSelectedVisualization(data);
      toast.success('Visualization created!');
    } catch (error: any) {
      toast.error('Failed to create visualization');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const exportReport = async (format: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/data/datasets/${datasetId}/export-report?format=${format}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (!response.ok) throw new Error('Failed to export report');
      
      const data = await response.json();
      
      // Create download link
      const blob = new Blob([data.report_content], { 
        type: format === 'html' ? 'text/html' : 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset?.name}_analysis_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Report exported as ${format.toUpperCase()}!`);
    } catch (error: any) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dataset analysis...</p>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p>Dataset not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
            <p className="text-gray-600 mt-2">{dataset.description}</p>
            <div className="flex items-center space-x-4 mt-4">
              <Badge variant="secondary">{dataset.file_type.toUpperCase()}</Badge>
              <Badge variant="outline">{(dataset.file_size / 1024 / 1024).toFixed(2)} MB</Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => exportReport('html')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export HTML
            </Button>
            <Button onClick={() => exportReport('pdf')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Target className="h-4 w-4 mr-2" />
            Data Quality
          </TabsTrigger>
          <TabsTrigger value="outliers">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Outliers
          </TabsTrigger>
          <TabsTrigger value="features">
            <Brain className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="visualize">
            <PieChart className="h-4 w-4 mr-2" />
            Visualize
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Zap className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dataset Shape</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard?.dataset_info?.shape?.[0] || 0} × {dashboard?.dataset_info?.shape?.[1] || 0}
                </div>
                <p className="text-xs text-muted-foreground">rows × columns</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missing Values</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.dataset_info?.missing_values || 0}</div>
                <p className="text-xs text-muted-foreground">cells with missing data</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duplicates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.dataset_info?.duplicate_rows || 0}</div>
                <p className="text-xs text-muted-foreground">duplicate rows</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Types</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard?.dataset_info?.numerical_columns + dashboard?.dataset_info?.categorical_columns || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboard?.dataset_info?.numerical_columns || 0} num, {dashboard?.dataset_info?.categorical_columns || 0} cat
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Plots */}
          {dashboard?.dashboard_plots && (
            <div className="space-y-6">
              {Object.entries(dashboard.dashboard_plots).map(([key, plotHtml]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="capitalize">{key.replace('_', ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      dangerouslySetInnerHTML={{ __html: plotHtml as string }}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              onClick={generateDashboard} 
              disabled={analysisLoading}
              size="lg"
            >
              {analysisLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
              Refresh Dashboard
            </Button>
          </div>
        </TabsContent>

        {/* Data Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Comprehensive Report</CardTitle>
                <CardDescription>
                  Get detailed data quality assessment, statistical summary, and insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="target-column">Target Column (Optional)</Label>
                  <Input
                    id="target-column"
                    placeholder="e.g., price, category, target"
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={generateComprehensiveReport} 
                  disabled={analysisLoading}
                  className="w-full"
                >
                  {analysisLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {comprehensiveReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Quality Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Overall Quality</span>
                        <span>{comprehensiveReport.data_quality?.quality_score?.toFixed(1)}%</span>
                      </div>
                      <Progress value={comprehensiveReport.data_quality?.quality_score || 0} className="mt-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Completeness</span>
                        <span>{comprehensiveReport.data_quality?.completeness?.toFixed(1)}%</span>
                      </div>
                      <Progress value={comprehensiveReport.data_quality?.completeness || 0} className="mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Comprehensive Report Results */}
          {comprehensiveReport && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {comprehensiveReport.insights?.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {comprehensiveReport.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Visualizations from report */}
              {comprehensiveReport.visualizations && Object.entries(comprehensiveReport.visualizations).map(([key, plotHtml]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="capitalize">{key.replace('_', ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      dangerouslySetInnerHTML={{ __html: plotHtml as string }}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Outliers Tab */}
        <TabsContent value="outliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outlier Detection</CardTitle>
              <CardDescription>
                Detect outliers using various statistical methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="outlier-method">Detection Method</Label>
                <Select value={outlierMethod} onValueChange={setOutlierMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iqr">IQR Method</SelectItem>
                    <SelectItem value="zscore">Z-Score Method</SelectItem>
                    <SelectItem value="isolation_forest">Isolation Forest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={detectOutliers} 
                disabled={analysisLoading}
                className="w-full"
              >
                {analysisLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                Detect Outliers
              </Button>
            </CardContent>
          </Card>

          {outlierInfo && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Outlier Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">{outlierInfo.total_outliers}</div>
                      <p className="text-sm text-muted-foreground">Total Outliers</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Object.keys(outlierInfo.outliers_by_column).length}</div>
                      <p className="text-sm text-muted-foreground">Affected Columns</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{outlierInfo.method.toUpperCase()}</div>
                      <p className="text-sm text-muted-foreground">Method Used</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outliers by Column</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(outlierInfo.outliers_by_column).map(([column, info]: [string, any]) => (
                      <div key={column} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{column}</h4>
                          <Badge variant={info.percentage > 5 ? "destructive" : "secondary"}>
                            {info.count} outliers ({info.percentage.toFixed(1)}%)
                          </Badge>
                        </div>
                        <Progress value={Math.min(info.percentage, 100)} className="mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outlierInfo.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Engineering Suggestions</CardTitle>
              <CardDescription>
                Get AI-powered suggestions for improving your features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="target-column-features">Target Column (Optional)</Label>
                <Input
                  id="target-column-features"
                  placeholder="e.g., price, category, target"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                />
              </div>
              <Button 
                onClick={getFeatureSuggestions} 
                disabled={analysisLoading}
                className="w-full"
              >
                {analysisLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                Get Suggestions
              </Button>
            </CardContent>
          </Card>

          {featureSuggestions && (
            <div className="space-y-6">
              {/* Encoding Suggestions */}
              {featureSuggestions.encoding_suggestions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Encoding Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {featureSuggestions.encoding_suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{suggestion.column}</h4>
                            <Badge variant={suggestion.priority === 'high' ? 'default' : 'secondary'}>
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Method: <span className="font-medium">{suggestion.method}</span>
                          </p>
                          <p className="text-sm">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scaling Suggestions */}
              {featureSuggestions.scaling_suggestions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Scaling Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {featureSuggestions.scaling_suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{suggestion.column}</h4>
                            <Badge variant={suggestion.priority === 'high' ? 'default' : 'secondary'}>
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Method: <span className="font-medium">{suggestion.method}</span>
                          </p>
                          <p className="text-sm">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feature Creation Suggestions */}
              {featureSuggestions.feature_creation_suggestions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Creation Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {featureSuggestions.feature_creation_suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{suggestion.type}</h4>
                            <Badge variant={suggestion.priority === 'high' ? 'default' : 'secondary'}>
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Columns: <span className="font-medium">{suggestion.columns?.join(', ') || suggestion.column}</span>
                          </p>
                          <p className="text-sm">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Missing Value Suggestions */}
              {featureSuggestions.missing_value_suggestions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Missing Value Handling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {featureSuggestions.missing_value_suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{suggestion.column}</h4>
                            <Badge variant={suggestion.priority === 'high' ? 'default' : 'secondary'}>
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Method: <span className="font-medium">{suggestion.method}</span>
                          </p>
                          <p className="text-sm">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Visualize Tab */}
        <TabsContent value="visualize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Visualization</CardTitle>
              <CardDescription>
                Generate interactive charts and plots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="histogram">Histogram</SelectItem>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                      <SelectItem value="box">Box Plot</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="correlation">Correlation Heatmap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="x-column">X Column</Label>
                  <Input
                    id="x-column"
                    placeholder="Column name"
                    value={xColumn}
                    onChange={(e) => setXColumn(e.target.value)}
                  />
                </div>
                {(chartType === 'scatter' || chartType === 'line') && (
                  <div>
                    <Label htmlFor="y-column">Y Column</Label>
                    <Input
                      id="y-column"
                      placeholder="Column name"
                      value={yColumn}
                      onChange={(e) => setYColumn(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <Button 
                onClick={createVisualization} 
                disabled={analysisLoading}
                className="w-full"
              >
                {analysisLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <PieChart className="h-4 w-4 mr-2" />}
                Create Visualization
              </Button>
            </CardContent>
          </Card>

          {selectedVisualization && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedVisualization.plot_html }}
                  className="w-full"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Powered Insights</h3>
            <p className="text-gray-600 mb-6">
              Generate comprehensive insights and recommendations based on your data analysis
            </p>
            <Button onClick={generateComprehensiveReport} disabled={analysisLoading} size="lg">
              {analysisLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Generate AI Insights
            </Button>
          </div>

          {comprehensiveReport && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comprehensiveReport.insights?.map((insight: string, index: number) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>⚡ Action Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comprehensiveReport.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat with Zyra AI
              </CardTitle>
              <CardDescription>
                Ask questions about your dataset and get AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Chat datasetId={datasetId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 