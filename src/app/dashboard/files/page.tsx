"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/files/FileUpload';
import { useUserStore } from '@/state/userStore';
import { 
  FileText, 
  Upload, 
  Database,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function FilesPage() {
  const { user } = useUserStore();
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleUploadComplete = (files: any[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  // Get file size limits based on user plan
  const getMaxFileSize = () => {
    if (!user?.account) return 10 * 1024 * 1024; // 10MB default
    
    switch (user.account.plan) {
      case 'PRO':
        return 50 * 1024 * 1024; // 50MB
      case 'ENTERPRISE':
        return 100 * 1024 * 1024; // 100MB
      default:
        return 10 * 1024 * 1024; // 10MB for FREE
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Files</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage your knowledge base files
            </p>
          </div>
        </div>

        {/* Account Info */}
        {user?.account && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-medium">{user.account.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{user.account.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max File Size</p>
                  <p className="font-medium">{formatFileSize(getMaxFileSize())}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manage Files
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <FileUpload 
              onUploadComplete={handleUploadComplete}
              maxFiles={user?.account?.plan === 'ENTERPRISE' ? 50 : user?.account?.plan === 'PRO' ? 20 : 10}
              maxFileSize={getMaxFileSize()}
            />

            {/* Recent Uploads */}
            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Uploads</CardTitle>
                  <CardDescription>
                    Files uploaded in this session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium">Upload Session</p>
                          <p className="text-sm text-muted-foreground">
                            {file.totalFiles} files processed successfully
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Just now
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Management</CardTitle>
                <CardDescription>
                  View and manage your uploaded knowledge files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">File Management Coming Soon</h3>
                  <p className="text-muted-foreground">
                    This feature will allow you to view, edit, and delete your uploaded files.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Analytics</CardTitle>
                <CardDescription>
                  Insights about your knowledge base performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Track file processing times, storage usage, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 