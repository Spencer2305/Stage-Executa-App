"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { ManualEmailProcessor } from "@/lib/simpleEmailSync";

interface EmailUploaderProps {
  assistantId: string;
  onEmailAdded?: (result: any) => void;
}

export default function EmailUploader({ assistantId, onEmailAdded }: EmailUploaderProps) {
  const [emailText, setEmailText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEmailUpload = async () => {
    if (!emailText.trim()) {
      toast.error('Please paste an email to upload');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Process the email text
      const result = await ManualEmailProcessor.processEmailText(
        assistantId,
        emailText,
        fileName || 'Manual Email'
      );

      if (result.success) {
        toast.success(`Email processed: ${result.subject || result.fileName}`);
        setEmailText('');
        setFileName('');
        
        if (onEmailAdded) {
          onEmailAdded(result);
        }
      }

    } catch (error) {
      console.error('Email processing error:', error);
      toast.error('Failed to process email');
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleEmail = `From: customer@example.com
Subject: Product Question
Date: 2024-01-15

Hi there,

I'm interested in your product and have a few questions:
1. What's the pricing?
2. Do you offer support?
3. How do I get started?

Thanks!
John`;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Manual Email Upload (FREE)
        </CardTitle>
        <CardDescription>
          Copy and paste important emails to add them to your knowledge base.
          Perfect for customer inquiries, support tickets, or key conversations.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Name Input */}
        <div className="space-y-2">
          <Label htmlFor="fileName">Email Name (Optional)</Label>
          <Input
            id="fileName"
            placeholder="e.g., Customer Question - Pricing"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </div>

        {/* Email Text Area */}
        <div className="space-y-2">
          <Label htmlFor="emailText">Email Content</Label>
          <Textarea
            id="emailText"
            placeholder={`Paste your email here. Include headers like:\n\n${exampleEmail}`}
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleEmailUpload}
          disabled={isProcessing || !emailText.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Processing Email...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Add to Knowledge Base
            </>
          )}
        </Button>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <p className="font-medium text-blue-900 mb-1">💡 How to use:</p>
          <ul className="text-blue-700 space-y-1">
            <li>• Copy emails from your email client</li>
            <li>• Include headers (From:, Subject:, Date:) for best results</li>
            <li>• Focus on important customer conversations</li>
            <li>• This is completely free - no limits!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 