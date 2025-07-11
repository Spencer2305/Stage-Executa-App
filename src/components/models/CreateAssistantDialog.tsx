"use client";

import { useState, useCallback } from "react";
import { useModelStore } from "@/state/modelStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Upload, 
  File, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Mail, 
  Check,
  Bot,
  FileText,
  Loader2,
  Cloud,
  Plus
} from "lucide-react";
import { toast } from "sonner";

interface CreateAssistantDialogProps {
  children: React.ReactNode;
}

export default function CreateAssistantDialog({ children }: CreateAssistantDialogProps) {
  const { createModel, isLoading } = useModelStore();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    files: [] as File[],
    gmailIntegration: false,
    useDropboxSync: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const totalSteps = 4;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList: FileList) => {
    const validTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain', 
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'];
    
    const newFiles = Array.from(fileList).filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(file.type) || validExtensions.includes(extension);
    });
    
    if (newFiles.length !== fileList.length) {
      toast.error('Some files were skipped. Only PDF, DOC, DOCX, TXT, MD, and image files are supported.');
    }
    
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles].slice(0, 10) // Limit to 10 files
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Assistant name is required";
      }
    }

    if (step === 2) {
      if (formData.files.length === 0 && !formData.useDropboxSync) {
        newErrors.files = "Please upload files or choose to sync from Dropbox";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      // Create assistant using real API
      await createModel({
        name: formData.name,
        description: formData.description,
        documents: formData.files,
        integrations: {
          gmail: formData.gmailIntegration,
        },
      });

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        files: [],
        gmailIntegration: false,
        useDropboxSync: false,
      });
      setCurrentStep(1);
      setErrors({});
      setOpen(false);
      
      toast.success('Assistant created successfully!');
      
    } catch (error) {
      console.error('Create assistant error:', error);
      setErrors({ submit: "Failed to create assistant. Please try again." });
      toast.error('Failed to create assistant');
    }
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) return <Check className="h-4 w-4" />;
    if (step === currentStep) return step.toString();
    return step.toString();
  };

  const getStepColor = (step: number) => {
    if (step < currentStep) return "bg-brand-800 text-white";
    if (step === currentStep) return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assistant Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Support Bot"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what your assistant will help with..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Knowledge Base *</Label>
              <p className="text-sm text-muted-foreground">
                Choose how to add knowledge to your assistant
              </p>
            </div>

            {/* Option Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={!formData.useDropboxSync ? "default" : "outline"}
                className="h-20 flex-col space-y-2"
                onClick={() => setFormData(prev => ({ ...prev, useDropboxSync: false }))}
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Upload Files</span>
              </Button>
              
              <Button
                variant={formData.useDropboxSync ? "default" : "outline"}
                className="h-20 flex-col space-y-2"
                onClick={() => setFormData(prev => ({ ...prev, useDropboxSync: true }))}
              >
                <Cloud className="h-6 w-6" />
                <span className="text-sm">Sync from Dropbox</span>
              </Button>
            </div>

            {/* Upload Files Section */}
            {!formData.useDropboxSync && (
              <div className="space-y-3">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : errors.files
                      ? "border-destructive"
                      : "border-muted-foreground/25"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drag and drop files here, or{" "}
                      <label className="text-primary cursor-pointer hover:underline">
                        browse
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
                          onChange={(e) => e.target.files && handleFiles(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports PDF, DOC, DOCX, TXT, MD, and image files (max 10 files)
                    </p>
                  </div>
                </div>

                {formData.files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files ({formData.files.length})</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {formData.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)}KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dropbox Sync Section */}
            {formData.useDropboxSync && (
              <div className="space-y-3">
                <div className="border rounded-lg p-6 text-center">
                  <Cloud className="mx-auto h-12 w-12 text-primary mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sync from Dropbox</p>
                    <p className="text-xs text-muted-foreground">
                      Your assistant will be created first, then you can sync files from your connected Dropbox account in the knowledge base section.
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      i
                    </div>
                    <div className="text-xs text-blue-700">
                      <strong>Note:</strong> Make sure you have connected your Dropbox account in Settings before proceeding.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errors.files && (
              <p className="text-sm text-destructive">{errors.files}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Integrations</Label>
              <p className="text-sm text-muted-foreground">
                Connect external data sources to enhance your assistant's knowledge.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Gmail Integration</p>
                    <p className="text-xs text-muted-foreground">
                      Import emails to enhance knowledge base
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Ready to Create</h3>
              <p className="text-sm text-muted-foreground">
                Your assistant will be created and trained with the uploaded documents.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              {formData.description && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium text-right max-w-[200px] truncate">
                    {formData.description}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Knowledge:</span>
                <span className="font-medium">
                  {formData.useDropboxSync 
                    ? "Sync from Dropbox" 
                    : `${formData.files.length} uploaded files`
                  }
                </span>
              </div>
            </div>

            {errors.submit && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {errors.submit}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create AI Assistant</DialogTitle>
          <DialogDescription>
            Set up your new AI assistant in just a few steps.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStepColor(step)}`}
              >
                {getStepIcon(step)}
              </div>
              {step < totalSteps && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    step < currentStep ? "bg-brand-800" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Assistant"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 