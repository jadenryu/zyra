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
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';

interface DashboardStats {
  totalProjects: number;
  totalDatasets: number;
  totalModels: number;
  recentActivity: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
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
            <div className="mb-8 mt-16 fade-in">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-black mb-3">
                    Dashboard
                  </h1>
                  <p className="text-lg text-black">
                    Overview of your data analysis projects and recent activity
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Link href="/projects/new" className="inline-flex items-center gap-2 px-6 py-3 button-primary text-white rounded-xl font-medium btn-smooth">
                    <Plus className="w-5 h-5" />
                    New Project
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 mb-8 md:grid-cols-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 interactive-card shadow-sm scale-in stagger-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                    +12% this month
                  </div>
                </div>
                <div className="text-3xl font-bold text-black mb-1">{stats.totalProjects}</div>
                <p className="text-sm font-medium text-black">Active Projects</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 interactive-card shadow-sm scale-in stagger-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                    +8% this month
                  </div>
                </div>
                <div className="text-3xl font-bold text-black mb-1">{stats.totalDatasets}</div>
                <p className="text-sm font-medium text-black">Datasets Processed</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 interactive-card shadow-sm scale-in stagger-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                    +25% this month
                  </div>
                </div>
                <div className="text-3xl font-bold text-black mb-1">{stats.totalModels}</div>
                <p className="text-sm font-medium text-black">ML Models Trained</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-black mb-2">Quick Actions</h2>
                  <p className="text-black mb-6">Get started with common workflows</p>
                  <div className="space-y-3">
                    <Link href="/projects/new" className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200">
                      <Plus className="w-5 h-5" />
                      Create New Project
                    </Link>
                    <Link href="/datasets/upload" className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-black rounded-xl font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-200">
                      <Database className="w-5 h-5" />
                      Upload Dataset
                    </Link>
                    <Link href="/models/train" className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-black rounded-xl font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-200">
                      <Brain className="w-5 h-5" />
                      Train Model
                    </Link>
                    <Link href="/analytics" className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-black rounded-xl font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-200">
                      <BarChart3 className="w-5 h-5" />
                      Run Analysis
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-black">Recent Activity</h2>
                    <Link href="/activity" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-semibold hover:underline transition-colors">
                      View all
                    </Link>
                  </div>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-muted rounded-lg pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded pulse" />
                            <div className="h-3 bg-muted rounded w-2/3 pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : stats.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentActivity.map((item, index) => {
                        const colors = {
                          project: 'from-green-400 to-green-600',
                          dataset: 'from-blue-400 to-blue-600',
                          model: 'from-purple-400 to-purple-600'
                        };
                        return (
                          <div key={index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 group hover-lift">
                            <div className={`w-10 h-10 bg-gradient-to-br ${colors[item.type as keyof typeof colors]} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                              <item.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-black truncate">
                                {item.name}
                              </p>
                              <p className="text-sm text-black">
                                {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {' '}
                                {new Date(item.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-xs font-medium text-black bg-gray-100 px-3 py-1 rounded-full">
                              {item.type}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 animate-bounce-in">
                      <TrendingUp className="w-12 h-12 text-black mx-auto mb-4 animate-breathing" />
                      <p className="text-black font-medium">No recent activity</p>
                      <p className="text-sm text-black mt-2">
                        Start by creating a project or uploading a dataset
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Getting Started Guide */}
            <div className="mt-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-black mb-3">Getting Started with Zyra</h2>
                <p className="text-black mb-8">
                  Follow these steps to get the most out of your data analysis workflow
                </p>
                <div className="grid gap-8 md:grid-cols-3">
                  <div className="flex items-start group">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-black mb-3 text-lg">Create Your First Project</h3>
                      <p className="text-black leading-relaxed">
                        Organize your analysis by creating a project. This helps you manage datasets, 
                        models, and results in one place.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start group">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-black mb-3 text-lg">Upload Your Data</h3>
                      <p className="text-black leading-relaxed">
                        Upload CSV, Excel, JSON, or Parquet files. Our AI will automatically detect 
                        data types and suggest cleaning operations.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start group">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-black mb-3 text-lg">Analyze & Model</h3>
                      <p className="text-black leading-relaxed">
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