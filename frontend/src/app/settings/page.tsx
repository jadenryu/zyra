'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  Edit,
  Star,
  Check,
  X,
  Zap,
  Target,
  BarChart3,
  Brain,
  Eye,
  Loader2,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  FileText,
  BookOpen,
  FileSearch,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  Mail,
  Lock,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AnalyticsConfiguration {
  id: number;
  name: string;
  is_default: boolean;
  show_dataset_overview: boolean;
  show_missing_analysis: boolean;
  show_correlation_analysis: boolean;
  show_statistical_summary: boolean;
  show_model_recommendations: boolean;
  show_preprocessing_recommendations: boolean;
  show_ai_insights: boolean;
  show_visualizations: boolean;
  include_correlation_heatmap: boolean;
  include_missing_values_chart: boolean;
  include_distribution_plots: boolean;
  include_outlier_detection: boolean;
  max_correlation_pairs: number;
  max_model_recommendations: number;
  include_advanced_stats: boolean;
  created_at: string;
  updated_at?: string;
}

const DEFAULT_CONFIG: Partial<AnalyticsConfiguration> = {
  name: '',
  is_default: false,
  show_dataset_overview: true,
  show_missing_analysis: true,
  show_correlation_analysis: true,
  show_statistical_summary: true,
  show_model_recommendations: true,
  show_preprocessing_recommendations: true,
  show_ai_insights: true,
  show_visualizations: true,
  include_correlation_heatmap: true,
  include_missing_values_chart: true,
  include_distribution_plots: true,
  include_outlier_detection: true,
  max_correlation_pairs: 10,
  max_model_recommendations: 5,
  include_advanced_stats: false
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [configurations, setConfigurations] = useState<AnalyticsConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AnalyticsConfiguration | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [analysisMode, setAnalysisMode] = useState('data');
  const [theme, setTheme] = useState('system');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    profile: 'public',
    analytics: true,
    sharing: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('analysisMode') || 'data';
    const savedTheme = localStorage.getItem('theme') || 'system';
    setAnalysisMode(savedMode);
    setTheme(savedTheme);
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics-config/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      }
    } catch (error) {
      toast.error('Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConfiguration = async (configData: Partial<AnalyticsConfiguration>) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics-config/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });
      
      if (response.ok) {
        const newConfig = await response.json();
        setConfigurations([...configurations, newConfig]);
        setShowCreateDialog(false);
        toast.success('Configuration created successfully');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create configuration');
      }
    } catch (error) {
      toast.error('Failed to create configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfiguration = async (id: number, configData: Partial<AnalyticsConfiguration>) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics-config/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });
      
      if (response.ok) {
        const updatedConfig = await response.json();
        setConfigurations(configurations.map(c => c.id === id ? updatedConfig : c));
        setEditingConfig(null);
        toast.success('Configuration updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update configuration');
      }
    } catch (error) {
      toast.error('Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfiguration = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics-config/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setConfigurations(configurations.filter(c => c.id !== id));
        toast.success('Configuration deleted successfully');
      } else {
        toast.error('Failed to delete configuration');
      }
    } catch (error) {
      toast.error('Failed to delete configuration');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics-config/${id}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const updatedConfig = await response.json();
        setConfigurations(configurations.map(c => ({ 
          ...c, 
          is_default: c.id === id 
        })));
        toast.success('Default configuration updated');
      } else {
        toast.error('Failed to set default configuration');
      }
    } catch (error) {
      toast.error('Failed to set default configuration');
    }
  };

  const handleCreatePreset = async (presetName: string) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics-config/presets/${presetName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const newConfig = await response.json();
        setConfigurations([...configurations, newConfig]);
        toast.success(`${presetName} configuration created`);
      } else {
        const error = await response.json();
        toast.error(error.detail || `Failed to create ${presetName} configuration`);
      }
    } catch (error) {
      toast.error(`Failed to create ${presetName} configuration`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = (mode: string) => {
    setAnalysisMode(mode);
    localStorage.setItem('analysisMode', mode);
    toast.success(`Switched to ${mode === 'data' ? 'Data Analysis' : 'Document Analysis'} mode`);
    // Trigger a page refresh to update the sidebar
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            Please sign in to continue
          </h1>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const settingsSections = [
    {
      id: 'mode',
      title: 'Analysis Mode',
      icon: Zap,
      description: 'Switch between different analysis modes',
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: User,
      description: 'Manage your account information',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      description: 'Customize the look and feel',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Configure how you receive updates',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Control your data and security settings',
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: Globe,
      description: 'Connect with external services',
    },
    {
      id: 'analytics',
      title: 'Analytics Configuration',
      icon: BarChart3,
      description: 'Manage your data analysis preferences',
    },
  ];

  const [activeSection, setActiveSection] = useState('mode');

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
            {/* Header */}
            <div className="mb-8 mt-16 animate-slide-in-right">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-black mb-3">
                    Settings
                  </h1>
                  <p className="text-lg text-black">
                    Customize your Zyra experience and manage your preferences
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button className="inline-flex items-center gap-2 px-6 py-3 button-primary text-white rounded-xl font-medium">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-4">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <nav className="space-y-2">
                  {settingsSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                        activeSection === section.id
                          ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-sm"
                          : "text-black hover:bg-gray-100 hover:text-black"
                      )}
                    >
                      <section.icon className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs opacity-75">{section.description}</div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  
                  {/* Analysis Mode Section */}
                  {activeSection === 'mode' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-black">
                            Analysis Mode
                          </h2>
                          <p className="text-sm text-black">
                            Choose your primary analysis workflow
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div
                          className={cn(
                            "p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 group",
                            analysisMode === 'data'
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          )}
                          onClick={() => handleModeChange('data')}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-black">
                                Data Analysis
                              </h3>
                              <p className="text-sm text-black">
                                Traditional data science workflows
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-black space-y-2">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4" />
                              <span>Dataset processing & analysis</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              <span>ML model training & deployment</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              <span>Automated insights & reports</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 group",
                            analysisMode === 'document'
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          )}
                          onClick={() => handleModeChange('document')}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-black">
                                Document Analysis
                              </h3>
                              <p className="text-sm text-black">
                                AI-powered document processing
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-black space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span>PDF & document analysis</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileSearch className="w-4 h-4" />
                              <span>Study assistant & summaries</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              <span>Writing tools & grammar check</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Appearance Section */}
                  {activeSection === 'appearance' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-black">
                            Appearance
                          </h2>
                          <p className="text-sm text-black">
                            Customize the look and feel of Zyra
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-black mb-3">
                            Theme
                          </label>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {[
                              { value: 'light', label: 'Light', icon: Sun },
                              { value: 'dark', label: 'Dark', icon: Moon },
                              { value: 'system', label: 'System', icon: Monitor },
                            ].map((themeOption) => (
                              <button
                                key={themeOption.value}
                                onClick={() => handleThemeChange(themeOption.value)}
                                className={cn(
                                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                                  theme === themeOption.value
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-green-300"
                                )}
                              >
                                <themeOption.icon className="w-5 h-5" />
                                <span className="font-medium">{themeOption.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Section */}
                  {activeSection === 'profile' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-black">
                            Profile Settings
                          </h2>
                          <p className="text-sm text-black">
                            Manage your account information
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              defaultValue={user.full_name || ''}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              defaultValue={user.email || ''}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Integrations Section */}
                  {activeSection === 'integrations' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-black">
                            API Integrations
                          </h2>
                          <p className="text-sm text-black">
                            Configure external API connections
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            OpenRouter API Key
                          </label>
                          <div className="relative">
                            <input
                              type={showApiKey ? "text" : "password"}
                              placeholder="Enter your OpenRouter API key"
                              className="w-full px-4 py-2 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Used for AI-powered features in Document Analysis mode
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analytics Configuration Section */}
                  {activeSection === 'analytics' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-black">
                            Analytics Configuration
                          </h2>
                          <p className="text-sm text-black">
                            Customize which features are shown in dataset analysis
                          </p>
                        </div>
                      </div>

                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                          <span className="ml-2 text-black">Loading configurations...</span>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Quick Actions */}
                          <div className="flex flex-wrap gap-3 mb-6">
                            <Button
                              onClick={() => setShowCreateDialog(true)}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Plus className="w-4 h-4" />
                              Create Custom
                            </Button>
                            <Button
                              onClick={() => handleCreatePreset('quick')}
                              disabled={isSaving}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Zap className="w-4 h-4" />
                              Quick Analysis
                            </Button>
                            <Button
                              onClick={() => handleCreatePreset('comprehensive')}
                              disabled={isSaving}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Target className="w-4 h-4" />
                              Comprehensive
                            </Button>
                            <Button
                              onClick={() => handleCreatePreset('minimal')}
                              disabled={isSaving}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Minimal
                            </Button>
                          </div>

                          {/* Configurations List */}
                          <div className="space-y-4">
                            {configurations.length === 0 ? (
                              <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-black mb-2">
                                  No configurations yet
                                </h3>
                                <p className="text-gray-600 mb-4">
                                  Create your first analytics configuration to customize dataset analysis
                                </p>
                                <Button
                                  onClick={() => setShowCreateDialog(true)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Create Configuration
                                </Button>
                              </div>
                            ) : (
                              configurations.map((config) => (
                                <Card key={config.id} className="border border-gray-200">
                                  <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center",
                                          config.is_default 
                                            ? "bg-green-100 text-green-600" 
                                            : "bg-gray-100 text-gray-600"
                                        )}>
                                          {config.is_default ? <Star className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                                        </div>
                                        <div>
                                          <h3 className="font-semibold text-black flex items-center gap-2">
                                            {config.name}
                                            {config.is_default && (
                                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                Default
                                              </Badge>
                                            )}
                                          </h3>
                                          <p className="text-sm text-gray-600">
                                            Created {new Date(config.created_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {!config.is_default && (
                                          <Button
                                            onClick={() => handleSetDefault(config.id)}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-1"
                                          >
                                            <Star className="w-3 h-3" />
                                            Set Default
                                          </Button>
                                        )}
                                        <Button
                                          onClick={() => setEditingConfig(config)}
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1"
                                        >
                                          <Edit className="w-3 h-3" />
                                          Edit
                                        </Button>
                                        <Button
                                          onClick={() => handleDeleteConfiguration(config.id)}
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Configuration Summary */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg",
                                        config.show_dataset_overview ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                                      )}>
                                        <Database className="w-3 h-3" />
                                        Dataset Overview
                                      </div>
                                      <div className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg",
                                        config.show_missing_analysis ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                                      )}>
                                        <FileSearch className="w-3 h-3" />
                                        Missing Analysis
                                      </div>
                                      <div className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg",
                                        config.show_correlation_analysis ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                                      )}>
                                        <RefreshCw className="w-3 h-3" />
                                        Correlations
                                      </div>
                                      <div className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg",
                                        config.show_ai_insights ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                                      )}>
                                        <Brain className="w-3 h-3" />
                                        AI Insights
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="border-t border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-black">
                        Changes are saved automatically
                      </p>
                      <button
                        onClick={handleSaveSettings}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Create Configuration Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Analytics Configuration</DialogTitle>
            <DialogDescription>
              Customize which features are shown when analyzing datasets
            </DialogDescription>
          </DialogHeader>
          <ConfigurationForm
            config={DEFAULT_CONFIG}
            onSave={handleCreateConfiguration}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Configuration Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={(open) => !open && setEditingConfig(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Analytics Configuration</DialogTitle>
            <DialogDescription>
              Update the settings for "{editingConfig?.name}"
            </DialogDescription>
          </DialogHeader>
          {editingConfig && (
            <ConfigurationForm
              config={editingConfig}
              onSave={(data) => handleUpdateConfiguration(editingConfig.id, data)}
              onCancel={() => setEditingConfig(null)}
              isLoading={isSaving}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Configuration Form Component
function ConfigurationForm({
  config,
  onSave,
  onCancel,
  isLoading,
  isEdit = false
}: {
  config: Partial<AnalyticsConfiguration>;
  onSave: (data: Partial<AnalyticsConfiguration>) => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}) {
  const [formData, setFormData] = useState(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Configuration name is required');
      return;
    }
    onSave(formData);
  };

  const handleToggle = (field: keyof AnalyticsConfiguration) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleNumberChange = (field: keyof AnalyticsConfiguration, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Settings */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Configuration Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter configuration name"
            required
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="is_default"
            checked={formData.is_default || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
          />
          <Label htmlFor="is_default">Set as default configuration</Label>
        </div>
      </div>

      {/* Analysis Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-black">Analysis Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'show_dataset_overview', label: 'Dataset Overview', icon: Database },
            { key: 'show_missing_analysis', label: 'Missing Values Analysis', icon: FileSearch },
            { key: 'show_correlation_analysis', label: 'Correlation Analysis', icon: RefreshCw },
            { key: 'show_statistical_summary', label: 'Statistical Summary', icon: BarChart3 },
            { key: 'show_model_recommendations', label: 'Model Recommendations', icon: Target },
            { key: 'show_preprocessing_recommendations', label: 'Preprocessing Tips', icon: Settings },
            { key: 'show_ai_insights', label: 'AI-Powered Insights', icon: Brain },
            { key: 'show_visualizations', label: 'Generate Visualizations', icon: Eye },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Switch
                id={key}
                checked={formData[key as keyof AnalyticsConfiguration] as boolean || false}
                onCheckedChange={() => handleToggle(key as keyof AnalyticsConfiguration)}
              />
              <Icon className="w-4 h-4 text-gray-500" />
              <Label htmlFor={key} className="flex-1">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Visualization Settings */}
      {formData.show_visualizations && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-black">Visualization Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'include_correlation_heatmap', label: 'Correlation Heatmap' },
              { key: 'include_missing_values_chart', label: 'Missing Values Chart' },
              { key: 'include_distribution_plots', label: 'Distribution Plots' },
              { key: 'include_outlier_detection', label: 'Outlier Detection' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Switch
                  id={key}
                  checked={formData[key as keyof AnalyticsConfiguration] as boolean || false}
                  onCheckedChange={() => handleToggle(key as keyof AnalyticsConfiguration)}
                />
                <Label htmlFor={key} className="flex-1">{label}</Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-black">Advanced Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="max_correlation_pairs">Max Correlation Pairs</Label>
            <Input
              id="max_correlation_pairs"
              type="number"
              min="1"
              max="50"
              value={formData.max_correlation_pairs || 10}
              onChange={(e) => handleNumberChange('max_correlation_pairs', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="max_model_recommendations">Max Model Recommendations</Label>
            <Input
              id="max_model_recommendations"
              type="number"
              min="1"
              max="10"
              value={formData.max_model_recommendations || 5}
              onChange={(e) => handleNumberChange('max_model_recommendations', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 border rounded-lg">
          <Switch
            id="include_advanced_stats"
            checked={formData.include_advanced_stats || false}
            onCheckedChange={() => handleToggle('include_advanced_stats')}
          />
          <Label htmlFor="include_advanced_stats" className="flex-1">
            Include Advanced Statistics (may slow analysis)
          </Label>
        </div>
      </div>

      {/* Form Actions */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Update Configuration' : 'Create Configuration'}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}