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
  Loader2
} from "lucide-react";

export default function CreateAIPage() {
  const router = useRouter();
  const { createModel, isLoading } = useModelStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    files: [] as File[],
    gmailIntegration: false,
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
      if (formData.files.length === 0) {
        newErrors.files = "Please upload at least one document";
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
      await createModel({
        name: formData.name,
        description: formData.description,
        documents: formData.files,
        integrations: {
          gmail: formData.gmailIntegration,
        },
      });

      toast.success("AI Assistant created successfully!");
      router.push("/dashboard");
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
              <Label>Upload Documents *</Label>
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
              {errors.files && (
                <p className="text-sm text-destructive">{errors.files}</p>
              )}
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
                <span className="text-muted-foreground">Documents:</span>
                <span className="font-medium">{formData.files.length} files</span>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Your AI Assistant</h1>
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
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Give your AI assistant a name and description"}
                {currentStep === 2 && "Upload documents that your AI will learn from"}
                {currentStep === 3 && "Connect external data sources (optional)"}
                {currentStep === 4 && "Review your settings and create the assistant"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 