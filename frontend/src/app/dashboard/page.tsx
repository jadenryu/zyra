'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { projectsAPI, datasetsAPI, mlAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart3,
  Database,
  FileText,
  Brain,
  Plus,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalProjects: number;
  totalDatasets: number;
  totalModels: number;
  recentActivity: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalDatasets: 0,
    totalModels: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [projectsRes, datasetsRes, modelsRes] = await Promise.all([
        projectsAPI.getAll({ limit: 100 }),
        datasetsAPI.getAll({ limit: 100 }),
        mlAPI.getAllModels({ limit: 100 }),
      ]);

      setStats({
        totalProjects: projectsRes.data.length,
        totalDatasets: datasetsRes.data.length,
        totalModels: modelsRes.data.length,
        recentActivity: [
          ...projectsRes.data.slice(0, 3).map((p: any) => ({
            ...p,
            type: 'project',
            icon: FileText,
          })),
          ...datasetsRes.data.slice(0, 3).map((d: any) => ({
            ...d,
            type: 'dataset',
            icon: Database,
          })),
          ...modelsRes.data.slice(0, 3).map((m: any) => ({
            ...m,
            type: 'model',
            icon: Brain,
          })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="heading-2 mb-4">Please sign in to continue</h1>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 ml-64">
          <div className="mx-auto max-w-7xl">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="heading-1">
                Welcome back, {user.full_name || user.email?.split('@')[0]}
              </h1>
              <p className="text-large text-muted">
                Here's an overview of your data analysis projects and recent activity.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 mb-8 md:grid-cols-3">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container brand">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-muted bg-brand-50 px-2 py-1 rounded-full">
                    +12% this month
                  </div>
                </div>
                <div className="stat-value">{stats.totalProjects}</div>
                <p className="stat-label">Active Projects</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container brand">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-muted bg-brand-50 px-2 py-1 rounded-full">
                    +8% this month
                  </div>
                </div>
                <div className="stat-value">{stats.totalDatasets}</div>
                <p className="stat-label">Datasets Processed</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container brand">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-muted bg-brand-50 px-2 py-1 rounded-full">
                    +25% this month
                  </div>
                </div>
                <div className="stat-value">{stats.totalModels}</div>
                <p className="stat-label">ML Models Trained</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <div className="professional-card">
                  <h2 className="heading-3 mb-4">Quick Actions</h2>
                  <p className="text-muted mb-6">Get started with common workflows</p>
                  <div className="space-y-3">
                    <Link href="/projects/new" className="quick-action-btn primary">
                      <Plus className="w-5 h-5" />
                      Create New Project
                    </Link>
                    <Link href="/datasets/upload" className="quick-action-btn secondary">
                      <Database className="w-5 h-5" />
                      Upload Dataset
                    </Link>
                    <Link href="/models/train" className="quick-action-btn secondary">
                      <Brain className="w-5 h-5" />
                      Train Model
                    </Link>
                    <Link href="/analytics" className="quick-action-btn secondary">
                      <BarChart3 className="w-5 h-5" />
                      Run Analysis
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="professional-card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="heading-3">Recent Activity</h2>
                    <Link href="/activity" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                      View all
                    </Link>
                  </div>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse" />
                            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : stats.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentActivity.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent transition-colors">
                          <div className="icon-container brand">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {item.name}
                            </p>
                            <p className="text-sm text-muted">
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {' '}
                              {new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-xs text-muted bg-accent px-2 py-1 rounded-full">
                            {item.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
                      <p className="text-muted">No recent activity</p>
                      <p className="text-sm text-muted mt-2">
                        Start by creating a project or uploading a dataset
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Getting Started Guide */}
            <div className="mt-8">
              <div className="professional-card">
                <h2 className="heading-3 mb-4">Getting Started with Zyra</h2>
                <p className="text-muted mb-8">
                  Follow these steps to get the most out of your data analysis workflow
                </p>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex items-start space-x-4">
                    <div className="icon-container brand text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Create Your First Project</h3>
                      <p className="text-sm text-muted leading-relaxed">
                        Organize your analysis by creating a project. This helps you manage datasets, 
                        models, and results in one place.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="icon-container brand text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Upload Your Data</h3>
                      <p className="text-sm text-muted leading-relaxed">
                        Upload CSV, Excel, JSON, or Parquet files. Our AI will automatically detect 
                        data types and suggest cleaning operations.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="icon-container brand text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Analyze & Model</h3>
                      <p className="text-sm text-muted leading-relaxed">
                        Run automated analysis, create visualizations, and train machine learning 
                        models with just a few clicks.
                      </p>
                    </div>
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