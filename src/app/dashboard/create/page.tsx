"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useModelStore } from "@/state/modelStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Globe, 
  Bot, 
  Settings, 
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Mail,
  Loader2,
  CheckCircle,
  MessageSquare,
  Code,
  Bell,
  Sparkles,
  Rocket,
  Heart,
  Cloud
} from "lucide-react";
import GmailIntegrationStep from "@/components/integrations/GmailIntegrationStep";

export default function CreateAIPage() {
  const router = useRouter();
  const { createModel, isLoading } = useModelStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreated, setIsCreated] = useState(false);
  const [createdAssistantId, setCreatedAssistantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    files: [] as File[],
    gmailIntegration: false,
    useDropboxSync: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const totalSteps = 5; // Increased to 5 steps

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
    const newFiles = Array.from(fileList).filter(file => {
      const validTypes = ['.pdf', '.docx', '.txt'];
      return validTypes.some(type => file.name.toLowerCase().endsWith(type));
    });
    
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
      const result = await createModel({
        name: formData.name,
        description: formData.description,
        documents: formData.files,
        useDropboxSync: formData.useDropboxSync,
        integrations: {
          gmail: formData.gmailIntegration,
        },
      });

      setIsCreated(true);
      setCreatedAssistantId(result?.id || 'new-assistant');
      
      // Move to success screen
      setCurrentStep(5);
      
      toast.success("AI Assistant created successfully!");
    } catch (error) {
      setErrors({ submit: "Failed to create assistant. Please try again." });
      toast.error("Failed to create assistant");
    }
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) return <Check className="h-4 w-4" />;
    if (step === currentStep) return step.toString();
    return step.toString();
  };

  const getStepColor = (step: number) => {
    if (step < currentStep) return "bg-primary text-primary-foreground";
    if (step === currentStep) return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  const handleTestChat = () => {
    if (createdAssistantId) {
      router.push(`/dashboard/assistants/${createdAssistantId}`);
    }
  };

  const handleEmbedIt = () => {
    const embedCode = `<script src="https://cdn.executa.ai/widget.js" data-assistant-id="${createdAssistantId}"></script>`;
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard!");
  };

  const handleUploadMore = () => {
    if (createdAssistantId) {
      router.push(`/dashboard/assistants/${createdAssistantId}?tab=knowledge`);
    }
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
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Knowledge Base *</Label>
              <p className="text-sm text-muted-foreground">
                Add knowledge to your assistant by uploading files or connecting integrations
              </p>
            </div>

            {/* Upload Files Section - Always Visible */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-primary" />
                <Label className="text-base font-medium">Upload Files</Label>
              </div>
              
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : errors.files && formData.files.length === 0 && !formData.useDropboxSync
                    ? "border-destructive"
                    : "border-muted-foreground/25"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Drag and drop files here, or{" "}
                    <label className="text-primary cursor-pointer hover:underline">
                      browse
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, DOCX, and TXT files (max 10 files)
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

            {/* Integrations Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Cloud className="h-5 w-5 text-primary" />
                <Label className="text-base font-medium">Available Integrations</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your accounts to sync files automatically
              </p>

              {/* Dropbox Integration */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  formData.useDropboxSync ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, useDropboxSync: !prev.useDropboxSync }))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Cloud className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dropbox</p>
                      <p className="text-xs text-muted-foreground">
                        Sync files from your Dropbox account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      formData.useDropboxSync 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {formData.useDropboxSync && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gmail Integration - Coming Soon */}
              <div className="border rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Gmail</p>
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

              {/* Other Integrations - Coming Soon */}
              <div className="border rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Google Drive</p>
                      <p className="text-xs text-muted-foreground">
                        Sync documents from Google Drive
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Coming Soon
                  </div>
                </div>
              </div>

              {formData.useDropboxSync && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      i
                    </div>
                    <div className="text-xs text-blue-700">
                      <strong>Note:</strong> Files from your connected Dropbox account will be automatically synced when the assistant is created. Make sure you have connected your Dropbox account in Settings first.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errors.files && (
              <p className="text-sm text-destructive">{errors.files}</p>
            )}
          </div>
        );

      case 3:
        return (
          <GmailIntegrationStep 
            onGmailStatusChange={(connected) => {
              setFormData(prev => ({ ...prev, gmailIntegration: connected }));
            }}
          />
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gmail Integration:</span>
                <span className={`font-medium ${formData.gmailIntegration ? 'text-green-600' : 'text-gray-500'}`}>
                  {formData.gmailIntegration ? '✓ Connected' : 'Not connected'}
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

      case 5:
        // Success/Confirmation Screen
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Your assistant is live and ready to help!
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </h3>
                <p className="text-sm text-gray-600">
                  {formData.name} has been created and trained. Want to test it out?
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-center space-x-2 text-green-700 mb-4">
                <Heart className="w-4 h-4" />
                <span className="font-medium">Next Steps</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Button 
                  onClick={handleTestChat}
                  className="bg-primary hover:bg-primary/90"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Test It
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleEmbedIt}
                >
                  <Code className="mr-2 h-4 w-4" />
                  Embed It
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleUploadMore}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload More Knowledge
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <Rocket className="w-4 h-4" />
                <span>Ready to deploy? Your assistant can now be embedded on websites, integrated with Slack, or accessed via API.</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 font-kanit uppercase tracking-wide">Create Your AI Assistant</h1>
            <p className="text-muted-foreground">
              Build a custom AI assistant trained on your knowledge base
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
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
                        step < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "Upload Knowledge Base"}
                {currentStep === 3 && "Integrations"}
                {currentStep === 4 && "Review & Create"}
                {currentStep === 5 && "Success!"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Give your AI assistant a name and description"}
                {currentStep === 2 && "Upload documents that your AI will learn from"}
                {currentStep === 3 && "Connect external data sources (optional)"}
                {currentStep === 4 && "Review your settings and create the assistant"}
                {currentStep === 5 && "Your assistant has been created successfully"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="min-h-[300px]">
                {renderStep()}
              </div>

              {/* Navigation - Hide on success screen */}
              {currentStep < 5 && (
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < 4 ? (
                    <Button onClick={nextStep}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {formData.useDropboxSync ? "Creating & Syncing..." : "Creating..."}
                        </>
                      ) : (
                        "Create Assistant"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 