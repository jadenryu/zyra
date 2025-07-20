'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { projectsAPI, datasetsAPI, mlAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart3,
  Database,
  FileText,
  Brain,
  TrendingUp,
  Plus,
  Activity,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please sign in to continue</h1>
          <Link href="/login">
            <Button className="mt-4">Sign In</Button>
          </Link>
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
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.full_name || user.email}!
              </h1>
              <p className="mt-2 text-gray-600">
                Here's what's happening with your data analysis projects.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 mb-8 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    Active data analysis projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Datasets</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDatasets}</div>
                  <p className="text-xs text-muted-foreground">
                    Uploaded and processed datasets
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ML Models</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalModels}</div>
                  <p className="text-xs text-muted-foreground">
                    Trained and deployed models
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 mb-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Get started with common tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/projects/new">
                    <Button className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Project
                    </Button>
                  </Link>
                  <Link href="/datasets/upload">
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="mr-2 h-4 w-4" />
                      Upload Dataset
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Run Analysis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest projects and datasets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : stats.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentActivity.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <item.icon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.type} • {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to start analyzing your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium">Create a Project</h3>
                      <p className="text-sm text-gray-600">
                        Start by creating a new project to organize your analysis.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium">Upload Data</h3>
                      <p className="text-sm text-gray-600">
                        Upload your CSV, Excel, or JSON files to get started.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">Analyze & Model</h3>
                      <p className="text-sm text-gray-600">
                        Run automated analysis and train ML models with one click.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
} 