'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  Upload,
  Database,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  FileText,
  Download,
  Settings,
  Zap,
  Target,
  Users,
  Clock,
  PieChart,
  LineChart,
  FileSpreadsheet,
  Loader2,
  Info,
  Eye,
  BarChart,
  Scatter3D
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface AnalysisResult {
  dataset_info: any;
  missing_analysis: any;
  column_analysis: any;
  statistical_summary: any;
  correlation_data: any;
  model_recommendations: any;
  preprocessing_recommendations: any;
  visualizations: any;
  ai_insights: any;
}

export default function EnhancedAnalyticsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [userDatasets, setUserDatasets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // File upload handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);
    if (targetColumn) {
      formData.append('target_column', targetColumn);
    }

    try {
      const response = await fetch('/api/v1/advanced-analytics/analyze-dataset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
      toast.success('Dataset analysis completed!');
    } catch (error) {
      toast.error('Failed to analyze dataset');
    } finally {
      setIsAnalyzing(false);
    }
  }, [targetColumn]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  // Load user datasets
  const loadUserDatasets = async () => {
    try {
      const response = await fetch('/api/v1/datasets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserDatasets(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load datasets');
    }
  };

  // Analyze existing dataset
  const analyzeExistingDataset = async (datasetId: string) => {
    if (!datasetId) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/v1/advanced-analytics/analyze-existing-dataset/${datasetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ target_column: targetColumn || null }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
      toast.success('Dataset analysis completed!');
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div className=\"min-h-screen bg-white flex items-center justify-center\">
        <div className=\"text-center\">
          <h1 className=\"text-2xl font-bold text-black mb-4\">
            Please sign in to continue
          </h1>
          <Link href=\"/login\" className=\"btn-primary\">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const renderCorrelationHeatmap = () => {
    if (!analysisResult?.correlation_data?.correlation_matrix) return null;

    const corrMatrix = analysisResult.correlation_data.correlation_matrix;
    const columns = Object.keys(corrMatrix);
    const zValues = columns.map(col1 => 
      columns.map(col2 => corrMatrix[col1]?.[col2] || 0)
    );

    return (
      <div className=\"w-full h-96\">
        <Plot
          data={[{
            type: 'heatmap',
            z: zValues,
            x: columns,
            y: columns,
            colorscale: 'RdBu',
            zmid: 0,
            showscale: true,
          }]}
          layout={{
            title: 'Feature Correlation Heatmap',
            xaxis: { title: 'Features' },
            yaxis: { title: 'Features' },
            height: 400,
            margin: { l: 100, r: 100, t: 50, b: 100 }
          }}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true }}
        />
      </div>
    );
  };

  const renderMissingValuesChart = () => {
    if (!analysisResult?.missing_analysis?.missing_counts) return null;

    const missingData = analysisResult.missing_analysis.missing_counts;
    const columns = Object.keys(missingData);
    const values = Object.values(missingData);

    return (
      <div className=\"w-full h-80\">
        <Plot
          data={[{
            type: 'bar',
            x: columns,
            y: values,
            marker: { color: 'rgba(239, 68, 68, 0.8)' },
          }]}
          layout={{
            title: 'Missing Values by Column',
            xaxis: { title: 'Columns' },
            yaxis: { title: 'Missing Count' },
            height: 320,
            margin: { l: 60, r: 60, t: 50, b: 100 }
          }}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true }}
        />
      </div>
    );
  };

  const renderDistributionPlots = () => {
    if (!analysisResult?.statistical_summary?.basic_stats) return null;

    const stats = analysisResult.statistical_summary.basic_stats;
    const numericColumns = Object.keys(stats);

    return (
      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
        {numericColumns.slice(0, 4).map((column, index) => (
          <div key={column} className=\"w-full h-64\">
            <Plot
              data={[{
                type: 'histogram',
                x: [stats[column].mean], // Placeholder - in real implementation, use actual data
                name: column,
                opacity: 0.7,
              }]}
              layout={{
                title: `${column} Distribution`,
                xaxis: { title: column },
                yaxis: { title: 'Frequency' },
                height: 250,
                margin: { l: 50, r: 50, t: 40, b: 50 }
              }}
              style={{ width: '100%', height: '100%' }}
              config={{ responsive: true }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className=\"min-h-screen bg-gray-50\">
      <Header />
      <div className=\"flex\">
        <Sidebar />
        <main className={cn(
          \"flex-1 pt-20 p-8 pb-20 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-screen\",
          isCollapsed ? \"ml-[70px]\" : \"ml-[280px]\"
        )}>
          <div className=\"mx-auto max-w-7xl\">
            {/* Header Section */}
            <div className=\"mb-8 mt-16 animate-slide-in-left\">
              <div className=\"flex flex-col sm:flex-row sm:items-center sm:justify-between\">
                <div>
                  <h1 className=\"text-4xl font-bold text-gray-900 mb-3\">
                    Advanced Analytics
                  </h1>
                  <p className=\"text-lg text-gray-600\">
                    AI-powered dataset analysis with comprehensive insights and recommendations
                  </p>
                </div>
                <div className=\"mt-4 sm:mt-0 flex items-center gap-3\">
                  <Button variant=\"outline\" className=\"flex items-center gap-2\">
                    <Settings className=\"w-4 h-4\" />
                    Configure
                  </Button>
                  <Button className=\"flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg\">
                    <Download className=\"w-4 h-4\" />
                    Export Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Analysis Input Section */}
            {!analysisResult && (
              <div className=\"grid gap-6 mb-8 lg:grid-cols-2\">
                {/* Upload Dataset */}
                <Card className=\"border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors\">
                  <CardHeader>
                    <CardTitle className=\"flex items-center gap-2\">
                      <Upload className=\"w-5 h-5 text-blue-500\" />
                      Upload Dataset
                    </CardTitle>
                    <CardDescription>
                      Upload a CSV or Excel file for comprehensive AI-powered analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      {...getRootProps()}
                      className={cn(
                        \"border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors\",
                        isDragActive ? \"border-blue-500 bg-blue-50\" : \"border-gray-300 hover:border-gray-400\"
                      )}
                    >
                      <input {...getInputProps()} />
                      {isAnalyzing ? (
                        <div className=\"flex flex-col items-center gap-4\">
                          <Loader2 className=\"w-8 h-8 text-blue-500 animate-spin\" />
                          <p className=\"text-gray-600\">Analyzing your dataset...</p>
                        </div>
                      ) : (
                        <div className=\"flex flex-col items-center gap-4\">
                          <FileSpreadsheet className=\"w-12 h-12 text-gray-400\" />
                          <div>
                            <p className=\"text-lg font-medium text-gray-900\">
                              {isDragActive ? \"Drop your file here\" : \"Drag & drop your dataset\"}
                            </p>
                            <p className=\"text-sm text-gray-500 mt-1\">
                              CSV, XLSX, or XLS files supported
                            </p>
                          </div>
                          <Button variant=\"outline\" className=\"mt-2\">
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className=\"mt-4\">
                      <Label htmlFor=\"target-column\">Target Column (Optional)</Label>
                      <Input
                        id=\"target-column\"
                        placeholder=\"e.g., price, category, target\"
                        value={targetColumn}
                        onChange={(e) => setTargetColumn(e.target.value)}
                        className=\"mt-1\"
                      />
                      <p className=\"text-xs text-gray-500 mt-1\">
                        Specify the target variable for better model recommendations
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Analyze Existing Dataset */}
                <Card>
                  <CardHeader>
                    <CardTitle className=\"flex items-center gap-2\">
                      <Database className=\"w-5 h-5 text-green-500\" />
                      Analyze Existing Dataset
                    </CardTitle>
                    <CardDescription>
                      Select a dataset from your projects for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className=\"space-y-4\">
                    <div>
                      <Label htmlFor=\"dataset-select\">Select Dataset</Label>
                      <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                        <SelectTrigger>
                          <SelectValue placeholder=\"Choose a dataset\" />
                        </SelectTrigger>
                        <SelectContent>
                          {userDatasets.map((dataset) => (
                            <SelectItem key={dataset.id} value={dataset.id.toString()}>
                              {dataset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor=\"existing-target-column\">Target Column (Optional)</Label>
                      <Input
                        id=\"existing-target-column\"
                        placeholder=\"e.g., price, category, target\"
                        value={targetColumn}
                        onChange={(e) => setTargetColumn(e.target.value)}
                      />
                    </div>

                    <Button 
                      onClick={() => analyzeExistingDataset(selectedDataset)}
                      disabled={!selectedDataset || isAnalyzing}
                      className=\"w-full\"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className=\"w-4 h-4 mr-2 animate-spin\" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className=\"w-4 h-4 mr-2\" />
                          Analyze Dataset
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={loadUserDatasets}
                      variant=\"outline\"
                      className=\"w-full\"
                    >
                      <FileText className=\"w-4 h-4 mr-2\" />
                      Load My Datasets
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResult && (
              <div className=\"space-y-8\">
                {/* Dataset Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className=\"flex items-center gap-2\">
                      <Info className=\"w-5 h-5 text-blue-500\" />
                      Dataset Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
                      <div className=\"bg-blue-50 p-4 rounded-lg\">
                        <div className=\"text-2xl font-bold text-blue-700\">
                          {analysisResult.dataset_info.shape?.[0]?.toLocaleString() || 'N/A'}
                        </div>
                        <p className=\"text-sm text-blue-600\">Rows</p>
                      </div>
                      <div className=\"bg-green-50 p-4 rounded-lg\">
                        <div className=\"text-2xl font-bold text-green-700\">
                          {analysisResult.dataset_info.shape?.[1] || 'N/A'}
                        </div>
                        <p className=\"text-sm text-green-600\">Columns</p>
                      </div>
                      <div className=\"bg-orange-50 p-4 rounded-lg\">
                        <div className=\"text-2xl font-bold text-orange-700\">
                          {analysisResult.dataset_info.total_missing_values || 0}
                        </div>
                        <p className=\"text-sm text-orange-600\">Missing Values</p>
                      </div>
                      <div className=\"bg-purple-50 p-4 rounded-lg\">
                        <div className=\"text-2xl font-bold text-purple-700\">
                          {analysisResult.dataset_info.duplicate_rows || 0}
                        </div>
                        <p className=\"text-sm text-purple-600\">Duplicates</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabbed Analysis Results */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">
                  <TabsList className=\"grid w-full grid-cols-6\">
                    <TabsTrigger value=\"overview\">Overview</TabsTrigger>
                    <TabsTrigger value=\"missing\">Missing Data</TabsTrigger>
                    <TabsTrigger value=\"correlations\">Correlations</TabsTrigger>
                    <TabsTrigger value=\"distributions\">Distributions</TabsTrigger>
                    <TabsTrigger value=\"models\">Models</TabsTrigger>
                    <TabsTrigger value=\"insights\">AI Insights</TabsTrigger>
                  </TabsList>

                  <TabsContent value=\"overview\" className=\"space-y-6\">
                    <div className=\"grid gap-6 lg:grid-cols-2\">
                      <Card>
                        <CardHeader>
                          <CardTitle>Column Types</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className=\"space-y-3\">
                            <div className=\"flex justify-between items-center\">
                              <span className=\"text-sm font-medium\">Numeric Columns</span>
                              <Badge variant=\"secondary\">
                                {analysisResult.column_analysis.numeric_columns?.length || 0}
                              </Badge>
                            </div>
                            <div className=\"flex justify-between items-center\">
                              <span className=\"text-sm font-medium\">Categorical Columns</span>
                              <Badge variant=\"secondary\">
                                {analysisResult.column_analysis.categorical_columns?.length || 0}
                              </Badge>
                            </div>
                            <div className=\"flex justify-between items-center\">
                              <span className=\"text-sm font-medium\">Potential Targets</span>
                              <Badge variant=\"secondary\">
                                {analysisResult.column_analysis.potential_target_columns?.length || 0}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Data Quality</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className=\"space-y-4\">
                            <div>
                              <div className=\"flex justify-between text-sm mb-1\">
                                <span>Completeness</span>
                                <span>
                                  {Math.round((1 - (analysisResult.dataset_info.total_missing_values || 0) / 
                                  ((analysisResult.dataset_info.shape?.[0] || 1) * (analysisResult.dataset_info.shape?.[1] || 1))) * 100)}%
                                </span>
                              </div>
                              <Progress value={Math.round((1 - (analysisResult.dataset_info.total_missing_values || 0) / 
                                ((analysisResult.dataset_info.shape?.[0] || 1) * (analysisResult.dataset_info.shape?.[1] || 1))) * 100)} />
                            </div>
                            <div>
                              <div className=\"flex justify-between text-sm mb-1\">
                                <span>Uniqueness</span>
                                <span>
                                  {Math.round((1 - (analysisResult.dataset_info.duplicate_rows || 0) / (analysisResult.dataset_info.shape?.[0] || 1)) * 100)}%
                                </span>
                              </div>
                              <Progress value={Math.round((1 - (analysisResult.dataset_info.duplicate_rows || 0) / (analysisResult.dataset_info.shape?.[0] || 1)) * 100)} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value=\"missing\" className=\"space-y-6\">
                    <Card>
                      <CardHeader>
                        <CardTitle>Missing Values Analysis</CardTitle>
                        <CardDescription>
                          Detailed analysis of missing data patterns and recommendations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analysisResult.missing_analysis.missing_counts && 
                         Object.keys(analysisResult.missing_analysis.missing_counts).length > 0 ? (
                          <div className=\"space-y-6\">
                            {renderMissingValuesChart()}
                            
                            <div className=\"grid gap-4 md:grid-cols-2\">
                              <div>
                                <h4 className=\"font-semibold mb-2\">Columns with Missing Data</h4>
                                <div className=\"space-y-2\">
                                  {Object.entries(analysisResult.missing_analysis.missing_percentages || {}).map(([col, pct]) => (
                                    <div key={col} className=\"flex justify-between items-center\">
                                      <span className=\"text-sm\">{col}</span>
                                      <Badge variant={Number(pct) > 50 ? \"destructive\" : Number(pct) > 20 ? \"secondary\" : \"outline\"}>
                                        {Number(pct).toFixed(1)}%
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className=\"font-semibold mb-2\">Recommendations</h4>
                                <div className=\"space-y-2\">
                                  {(analysisResult.missing_analysis.missing_data_patterns?.recommendations || []).map((rec: string, idx: number) => (
                                    <div key={idx} className=\"flex items-start gap-2\">
                                      <CheckCircle className=\"w-4 h-4 text-green-500 mt-0.5\" />
                                      <span className=\"text-sm\">{rec}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className=\"text-center py-8\">
                            <CheckCircle className=\"w-12 h-12 text-green-500 mx-auto mb-4\" />
                            <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">No Missing Data!</h3>
                            <p className=\"text-gray-600\">Your dataset is complete with no missing values.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value=\"correlations\" className=\"space-y-6\">
                    <Card>
                      <CardHeader>
                        <CardTitle>Feature Correlations</CardTitle>
                        <CardDescription>
                          Correlation analysis between numeric features
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analysisResult.correlation_data.correlation_matrix ? (
                          <div className=\"space-y-6\">
                            {renderCorrelationHeatmap()}
                            
                            {analysisResult.correlation_data.high_correlation_pairs?.length > 0 && (
                              <div>
                                <h4 className=\"font-semibold mb-3\">High Correlation Pairs</h4>
                                <div className=\"grid gap-3 md:grid-cols-2\">
                                  {analysisResult.correlation_data.high_correlation_pairs.slice(0, 6).map((pair: any, idx: number) => (
                                    <div key={idx} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-lg\">
                                      <div className=\"flex items-center gap-2\">
                                        <BarChart className=\"w-4 h-4 text-blue-500\" />
                                        <span className=\"text-sm font-medium\">
                                          {pair.feature_1} ↔ {pair.feature_2}
                                        </span>
                                      </div>
                                      <Badge variant={Math.abs(pair.correlation) > 0.8 ? \"destructive\" : \"secondary\"}>
                                        {pair.correlation.toFixed(3)}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className=\"text-center py-8\">
                            <BarChart3 className=\"w-12 h-12 text-gray-400 mx-auto mb-4\" />
                            <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">No Numeric Data</h3>
                            <p className=\"text-gray-600\">Correlation analysis requires numeric columns.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value=\"distributions\" className=\"space-y-6\">
                    <Card>
                      <CardHeader>
                        <CardTitle>Data Distributions</CardTitle>
                        <CardDescription>
                          Statistical distributions of numeric features
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analysisResult.statistical_summary.basic_stats ? (
                          <div className=\"space-y-6\">
                            {renderDistributionPlots()}
                            
                            <div className=\"grid gap-4 md:grid-cols-2 lg:grid-cols-3\">
                              {Object.entries(analysisResult.statistical_summary.basic_stats).slice(0, 6).map(([col, stats]: [string, any]) => (
                                <div key={col} className=\"p-4 border rounded-lg\">
                                  <h4 className=\"font-semibold mb-3\">{col}</h4>
                                  <div className=\"space-y-2 text-sm\">
                                    <div className=\"flex justify-between\">
                                      <span>Mean:</span>
                                      <span className=\"font-mono\">{stats.mean?.toFixed(2) || 'N/A'}</span>
                                    </div>
                                    <div className=\"flex justify-between\">
                                      <span>Std:</span>
                                      <span className=\"font-mono\">{stats.std?.toFixed(2) || 'N/A'}</span>
                                    </div>
                                    <div className=\"flex justify-between\">
                                      <span>Min:</span>
                                      <span className=\"font-mono\">{stats.min?.toFixed(2) || 'N/A'}</span>
                                    </div>
                                    <div className=\"flex justify-between\">
                                      <span>Max:</span>
                                      <span className=\"font-mono\">{stats.max?.toFixed(2) || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className=\"text-center py-8\">
                            <PieChart className=\"w-12 h-12 text-gray-400 mx-auto mb-4\" />
                            <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">No Statistical Data</h3>
                            <p className=\"text-gray-600\">Statistical analysis requires numeric columns.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value=\"models\" className=\"space-y-6\">
                    <Card>
                      <CardHeader>
                        <CardTitle>Model Recommendations</CardTitle>
                        <CardDescription>
                          AI-powered recommendations for machine learning models
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className=\"space-y-6\">
                          {/* Recommended Models */}
                          <div>
                            <h4 className=\"font-semibold mb-3\">Recommended Models</h4>
                            <div className=\"grid gap-3 md:grid-cols-2\">
                              {(analysisResult.model_recommendations.recommended_models || []).map((model: any, idx: number) => (
                                <div key={idx} className=\"p-4 border rounded-lg hover:shadow-md transition-shadow\">
                                  <div className=\"flex items-center justify-between mb-2\">
                                    <h5 className=\"font-medium\">{model.model}</h5>
                                    <Badge variant={model.priority === 'high' ? 'default' : model.priority === 'medium' ? 'secondary' : 'outline'}>
                                      {model.priority}
                                    </Badge>
                                  </div>
                                  <p className=\"text-sm text-gray-600\">{model.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Preprocessing Recommendations */}
                          <div>
                            <h4 className=\"font-semibold mb-3\">Preprocessing Steps</h4>
                            <div className=\"space-y-3\">
                              {(analysisResult.preprocessing_recommendations.preprocessing_steps || []).map((step: any, idx: number) => (
                                <div key={idx} className=\"flex items-start gap-3 p-3 bg-gray-50 rounded-lg\">
                                  <div className={cn(
                                    \"w-2 h-2 rounded-full mt-2\",
                                    step.priority === 'high' ? 'bg-red-500' : step.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                  )} />
                                  <div className=\"flex-1\">
                                    <h6 className=\"font-medium\">{step.step}</h6>
                                    <p className=\"text-sm text-gray-600 mt-1\">{step.method}</p>
                                  </div>
                                  <Badge variant=\"outline\">{step.priority}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Dataset Characteristics */}
                          <div>
                            <h4 className=\"font-semibold mb-3\">Dataset Characteristics</h4>
                            <div className=\"grid grid-cols-2 gap-4\">
                              <div className=\"p-3 bg-blue-50 rounded-lg\">
                                <div className=\"text-lg font-semibold text-blue-700\">
                                  {analysisResult.model_recommendations.dataset_characteristics?.size || 'Unknown'}
                                </div>
                                <p className=\"text-sm text-blue-600\">Dataset Size</p>
                              </div>
                              <div className=\"p-3 bg-green-50 rounded-lg\">
                                <div className=\"text-lg font-semibold text-green-700\">
                                  {analysisResult.model_recommendations.dataset_characteristics?.complexity || 'Unknown'}
                                </div>
                                <p className=\"text-sm text-green-600\">Complexity</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value=\"insights\" className=\"space-y-6\">
                    <Card>
                      <CardHeader>
                        <CardTitle className=\"flex items-center gap-2\">
                          <Brain className=\"w-5 h-5 text-purple-500\" />
                          AI-Powered Insights
                        </CardTitle>
                        <CardDescription>
                          Intelligent analysis and recommendations for your dataset
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className=\"space-y-6\">
                          {/* Summary */}
                          <div className=\"p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200\">
                            <h4 className=\"font-semibold mb-2\">Summary</h4>
                            <p className=\"text-gray-700\">{analysisResult.ai_insights.summary}</p>
                          </div>

                          {/* Key Findings */}
                          <div>
                            <h4 className=\"font-semibold mb-3\">Key Findings</h4>
                            <div className=\"space-y-2\">
                              {(analysisResult.ai_insights.key_findings || []).map((finding: string, idx: number) => (
                                <div key={idx} className=\"flex items-start gap-2\">
                                  <Zap className=\"w-4 h-4 text-yellow-500 mt-0.5\" />
                                  <span className=\"text-sm\">{finding}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div>
                            <h4 className=\"font-semibold mb-3\">Recommendations</h4>
                            <div className=\"space-y-2\">
                              {(analysisResult.ai_insights.recommendations || []).map((rec: string, idx: number) => (
                                <div key={idx} className=\"flex items-start gap-2\">
                                  <Target className=\"w-4 h-4 text-green-500 mt-0.5\" />
                                  <span className=\"text-sm\">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Analysis Metadata */}
                          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t\">
                            <div className=\"flex items-center gap-2\">
                              <Clock className=\"w-4 h-4 text-gray-500\" />
                              <span className=\"text-sm text-gray-600\">
                                Estimated Time: {analysisResult.ai_insights.estimated_analysis_time}
                              </span>
                            </div>
                            <div className=\"flex items-center gap-2\">
                              <Users className=\"w-4 h-4 text-gray-500\" />
                              <span className=\"text-sm text-gray-600\">
                                Difficulty: {analysisResult.ai_insights.difficulty_assessment}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className=\"flex justify-center gap-4\">
                  <Button variant=\"outline\" onClick={() => setAnalysisResult(null)}>
                    <Upload className=\"w-4 h-4 mr-2\" />
                    Analyze Another Dataset
                  </Button>
                  <Button>
                    <Download className=\"w-4 h-4 mr-2\" />
                    Export Analysis Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}