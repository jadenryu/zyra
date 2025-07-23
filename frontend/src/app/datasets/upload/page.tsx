"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth";
import { projectsAPI, datasetsAPI } from "@/lib/api";
import { FileUp, AlertCircle, CheckCircle2, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
}

export default function DatasetUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [datasetName, setDatasetName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectsAPI.getAll();
        setProjects(response.data);
        
        // If project ID is provided in URL and exists in the projects list, select it
        if (projectIdFromUrl && response.data.some(p => p.id === projectIdFromUrl)) {
          setSelectedProject(projectIdFromUrl);
        } else if (response.data.length > 0) {
          setSelectedProject(response.data[0].id);
        }
      } catch (error) {
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProjects();
    }
  }, [user, projectIdFromUrl]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      
      // Auto-set dataset name from filename if not already set
      if (!datasetName) {
        const fileName = droppedFile.name.split('.')[0]; // Remove extension
        setDatasetName(fileName);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-set dataset name from filename if not already set
      if (!datasetName) {
        const fileName = selectedFile.name.split('.')[0]; // Remove extension
        setDatasetName(fileName);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedProject || !datasetName.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', selectedProject);
      formData.append('name', datasetName.trim());
      formData.append('description', description.trim());

      // For now, simulate a successful upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgress(100);
      setSuccess(true);
      toast.success("Dataset uploaded successfully!");
      
      // Reset form
      setTimeout(() => {
        setFile(null);
        setDatasetName("");
        setDescription("");
        setProgress(0);
        setSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);

    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 ml-64">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/datasets" className="btn-secondary p-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="heading-1">Upload Dataset</h1>
                <p className="text-large text-muted">Add a new dataset to your project</p>
              </div>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Upload Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* File Upload */}
                <div className="professional-card">
                  <h2 className="heading-3 mb-4">Select File</h2>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      file ? 'border-brand-300 bg-brand-50' : 'border-border hover:border-brand-300'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    {file ? (
                      <div className="space-y-4">
                        <CheckCircle2 className="h-12 w-12 text-brand-600 mx-auto" />
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-sm text-muted">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => {
                            setFile(null);
                            setDatasetName("");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Choose different file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 text-muted mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-foreground mb-2">
                            Drop your file here or click to browse
                          </p>
                          <p className="text-sm text-muted">
                            Supports CSV, Excel, JSON, and Parquet files up to 100MB
                          </p>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-primary"
                        >
                          <FileUp className="h-4 w-4 mr-2" />
                          Select File
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept=".csv,.xlsx,.xls,.json,.parquet"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Dataset Information */}
                <div className="professional-card">
                  <h2 className="heading-3 mb-4">Dataset Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="project" className="text-foreground font-medium">Project *</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {projects.length === 0 && (
                        <p className="text-sm text-muted mt-2">
                          No projects found. <Link href="/projects/new" className="text-brand-600 hover:text-brand-700 font-medium">Create one first</Link>
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name" className="text-foreground font-medium">Dataset Name *</Label>
                      <Input
                        id="name"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        placeholder="Enter dataset name"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this dataset contains..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="professional-card">
                    <h2 className="heading-3 mb-4">Upload Progress</h2>
                    <div className="space-y-4">
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-muted">
                        {progress < 100 ? `Uploading... ${progress}%` : 'Processing dataset...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={!file || !selectedProject || !datasetName.trim() || uploading}
                    className="btn-primary flex-1"
                  >
                    {uploading ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Dataset
                      </>
                    )}
                  </button>
                  <Link href="/datasets" className="btn-secondary">
                    Cancel
                  </Link>
                </div>
              </div>

              {/* Upload Guidelines */}
              <div className="space-y-6">
                <div className="professional-card">
                  <h3 className="heading-3 mb-4">Upload Guidelines</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Supported Formats</h4>
                      <ul className="space-y-1 text-muted">
                        <li>• CSV files (.csv)</li>
                        <li>• Excel files (.xlsx, .xls)</li>
                        <li>• JSON files (.json)</li>
                        <li>• Parquet files (.parquet)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">File Requirements</h4>
                      <ul className="space-y-1 text-muted">
                        <li>• Maximum file size: 100MB</li>
                        <li>• Include column headers</li>
                        <li>• Use consistent data types</li>
                        <li>• Avoid special characters in column names</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Best Practices</h4>
                      <ul className="space-y-1 text-muted">
                        <li>• Clean your data before upload</li>
                        <li>• Use descriptive column names</li>
                        <li>• Handle missing values appropriately</li>
                        <li>• Document your dataset with descriptions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {success && (
                  <div className="professional-card border-brand-200 bg-brand-50">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="h-6 w-6 text-brand-600" />
                      <h3 className="heading-3 text-brand-700">Upload Successful!</h3>
                    </div>
                    <p className="text-sm text-brand-600 mb-4">
                      Your dataset has been uploaded and is ready for analysis.
                    </p>
                    <div className="flex gap-3">
                      <Link href="/datasets" className="btn-primary text-sm">
                        View Datasets
                      </Link>
                      <Link href={`/projects/${selectedProject}`} className="btn-secondary text-sm">
                        View Project
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 