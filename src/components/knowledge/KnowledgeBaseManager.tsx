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
  Mail,
  RefreshCw,
  Cloud,
  AlertTriangle
} from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Document as ModelDocument } from "@/types/model";
import { modelApi } from "@/utils/api";
import { toast } from "sonner";
import { useNotification } from "@/components/ui/notification";
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
  const { showSuccess, showError } = useNotification();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fileToRemove, setFileToRemove] = useState<{id: string, name: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string | number | null | undefined) => {
    if (!date) return 'Unknown';
    
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        return 'Unknown';
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime()) || !dateObj.getTime) {
        return 'Unknown';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', date);
      return 'Unknown';
    }
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
      
      // Show completion briefly before resetting
      setUploadProgress(100);
      
      // Small delay to show completion state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the files list
      onFilesUpdated(result.files);
      
      showSuccess(`Successfully added ${result.newFiles} files to knowledge base`);
      
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      showError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = async (fileId: string, fileName: string) => {
    // Show custom confirmation dialog instead of window.confirm
    setFileToRemove({ id: fileId, name: fileName });
    setShowConfirmDialog(true);
  };

  const confirmRemoveFile = async () => {
    if (!fileToRemove) return;
    
    try {
      console.log(`🗑️ Removing file ${fileToRemove.id} from assistant ${assistantId}`);
      
      const result = await modelApi.removeFile(assistantId, fileToRemove.id);
      
      // Update the files list
      onFilesUpdated(result.remainingFiles);
      
      showSuccess(
        result.deletedCompletely 
          ? `File "${fileToRemove.name}" completely deleted`
          : `File "${fileToRemove.name}" removed from this assistant`
      );
      
    } catch (error) {
      console.error('❌ Error removing file:', error);
      showError('Failed to remove file. Please try again.');
    } finally {
      setShowConfirmDialog(false);
      setFileToRemove(null);
    }
  };

  const cancelRemoveFile = () => {
    setShowConfirmDialog(false);
    setFileToRemove(null);
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
      showError('No content available for preview');
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
      
      showSuccess(`Successfully synced ${result.syncedFiles} files from ${integration}`);
      
    } catch (error: any) {
      console.error(`❌ Error syncing from ${integration}:`, error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      showError(`Failed to sync files from ${integration}: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header with Add Files button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Documents</h3>
          <p className="text-sm text-muted-foreground">
            {files.length} {files.length === 1 ? 'document' : 'documents'} • Upload and manage files
          </p>
        </div>
        <Button onClick={handleFileSelect} disabled={isUploading} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Files
        </Button>
      </div>
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
            Supports PDF, DOC, DOCX, TXT, and image files
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
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
          className="hidden"
        />

        {/* Files List */}
        <div className="flex-1 overflow-hidden">
          {files.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-3">
              {(() => {
                const gmailFiles = files.filter(file => file.type === 'gmail' || file.name.startsWith('Gmail:'));
                const otherFiles = files.filter(file => file.type !== 'gmail' && !file.name.startsWith('Gmail:'));

                return (
                  <>
                    {/* Gmail Section */}
                    {gmailFiles.length > 0 && (
                      <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Gmail</span>
                          <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                            {gmailFiles.length} {gmailFiles.length === 1 ? 'email' : 'emails'}
                          </Badge>
                        </div>
                        <p className="text-xs text-blue-700 mb-2">
                          Emails from your connected Gmail account
                        </p>
                        <div className="text-xs text-blue-600">
                          Use the Email Knowledge Manager below for detailed email management
                        </div>
                      </div>
                    )}

                    {/* Regular Files */}
                    {otherFiles.map((file) => (
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
                  </>
                );
              })()}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm">No files in knowledge base</p>
            <p className="text-xs">Upload documents to get started</p>
          </div>
        )}
        </div>

      {/* Custom Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove File
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>"{fileToRemove?.name}"</strong> from the knowledge base?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={cancelRemoveFile}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRemoveFile}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 