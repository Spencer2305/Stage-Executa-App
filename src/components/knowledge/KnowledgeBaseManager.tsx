"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Cloud
} from "lucide-react";
import { Document as ModelDocument } from "@/types/model";
import { modelApi } from "@/utils/api";
import { toast } from "sonner";
import axios from "axios";

interface KnowledgeBaseManagerProps {
  assistantId: string;
  files: ModelDocument[];
  onFilesUpdated: (files: ModelDocument[]) => void;
}

export default function KnowledgeBaseManager({ 
  assistantId, 
  files, 
  onFilesUpdated 
}: KnowledgeBaseManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const getFileIcon = (type: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-700 border-gray-200 bg-gray-50">
            <Clock className="h-3 w-3 mr-1" />
            Uploading
          </Badge>
        );
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      await handleFileUpload(selectedFiles);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await handleFileUpload(droppedFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleFileUpload = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log(`📁 Uploading ${selectedFiles.length} files to assistant ${assistantId}`);
      
      const result = await modelApi.addFiles(assistantId, selectedFiles, (progress) => {
        setUploadProgress(progress);
      });

      console.log('✅ Files uploaded successfully:', result);
      
      // Update the files list
      onFilesUpdated(result.files);
      
      toast.success(`Successfully added ${result.newFiles} files to knowledge base`);
      
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${fileName}" from the knowledge base?`)) {
      return;
    }

    try {
      console.log(`🗑️ Removing file ${fileId} from assistant ${assistantId}`);
      
      const result = await modelApi.removeFile(assistantId, fileId);
      
      // Update the files list
      onFilesUpdated(result.remainingFiles);
      
      toast.success(
        result.deletedCompletely 
          ? `File "${fileName}" completely deleted`
          : `File "${fileName}" removed from this assistant`
      );
      
    } catch (error) {
      console.error('❌ Error removing file:', error);
      toast.error('Failed to remove file. Please try again.');
    }
  };

  const handleViewFile = (file: ModelDocument) => {
    if (file.content) {
      // Create a new window to show the extracted text
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${file.name} - Content Preview</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 8px; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>${file.name}</h1>
              <div class="content">${file.content}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      toast.error('No content available for preview');
    }
  };

  const handleSyncFromIntegration = async (integration: string) => {
    setIsSyncing(true);
    setSyncProgress(0);
    setShowSyncDialog(false);

    try {
      console.log(`🔄 Syncing files from ${integration} for assistant ${assistantId}`);
      
      // Use axios with authentication like other API calls
      const token = localStorage.getItem('executa-auth-token');
      const response = await axios.post(`/api/assistants/${assistantId}/sync-simple`, 
        { integration },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = response.data;
      
      // Update the files list
      onFilesUpdated(result.files);
      
      toast.success(`Successfully synced ${result.syncedFiles} files from ${integration}`);
      
    } catch (error: any) {
      console.error(`❌ Error syncing from ${integration}:`, error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      toast.error(`Failed to sync files from ${integration}: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Knowledge Base</span>
            </CardTitle>
            <CardDescription>
              {files.length} documents • Manage your assistant's knowledge
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isUploading || isSyncing} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Knowledge'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sync from Integrations</DialogTitle>
                  <DialogDescription>
                    Choose a connected service to sync files from
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-start space-x-3 h-12"
                    onClick={() => handleSyncFromIntegration('dropbox')}
                    disabled={isSyncing}
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <Cloud className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Dropbox</div>
                      <div className="text-sm text-gray-500">Sync all files from your Dropbox</div>
                    </div>
                  </Button>
                  {/* Future integrations can be added here */}
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleFileSelect} disabled={isUploading || isSyncing} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Files
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleFileSelect}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            {isUploading 
              ? `Uploading... ${uploadProgress}%`
              : 'Drop files here or click to browse'
            }
          </p>
          <p className="text-xs text-gray-500">
            Supports PDF, DOC, DOCX, TXT files
          </p>
          
          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
        />

        {/* Files List */}
        {files.length > 0 ? (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium truncate">
                          {file.name}
                        </span>
                        {getStatusBadge(file.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>Uploaded {formatDate(file.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {file.content && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFile(file)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id, file.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm">No files in knowledge base</p>
            <p className="text-xs">Upload documents to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 