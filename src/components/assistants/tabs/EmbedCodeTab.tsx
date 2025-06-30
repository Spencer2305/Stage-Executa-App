'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Code } from "lucide-react";
import Editor from '@monaco-editor/react';
import { toast } from "sonner";
import { generateStyledEmbedCode, generateRawEmbedCode } from '@/utils/embedCodeGeneration';

interface EmbedCodeTabProps {
  embedStyle: any;
  assistant: any;
}

export default function EmbedCodeTab({ embedStyle, assistant }: EmbedCodeTabProps) {
  const [embedCodeType, setEmbedCodeType] = useState<'styled' | 'raw' | 'wordpress'>('styled');

  const copyEmbedCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Embed code copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy embed code");
    }
  };

  const downloadWordPressPlugin = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch(`/api/models/${assistant.id}/wordpress-plugin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download plugin');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `executa-chat-plugin-${assistant.id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("WordPress plugin downloaded!");
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Failed to download WordPress plugin");
    }
  };

  const getEmbedCode = () => {
    switch (embedCodeType) {
      case 'styled':
        return generateStyledEmbedCode(embedStyle, assistant);
      case 'raw':
        return generateRawEmbedCode(assistant);
      case 'wordpress':
        return `<!-- Download the plugin using the button above -->
<!-- Then use the below shortcode to embed into your site -->

[executa_chat assistant_id="${assistant?.id || 'your-assistant-id'}"]`;
      default:
        return generateStyledEmbedCode(embedStyle, assistant);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Embed Code</h4>
        <p className="text-xs text-gray-500">
          Copy this code and paste it into your website's HTML to add the chat widget.
        </p>
        
        <Tabs value={embedCodeType} onValueChange={(value) => setEmbedCodeType(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="styled">Styled</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="styled" className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Styled embed:</strong> Includes all your custom styling and theme settings.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="raw" className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>Raw embed:</strong> Basic functionality only. Style with your own CSS.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="wordpress" className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-xs text-purple-700 mb-2">
                <strong>WordPress:</strong> Use our plugin for easy integration.
              </p>
              <Button 
                onClick={downloadWordPressPlugin}
                size="sm" 
                variant="outline"
                className="flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>Download Plugin</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Code</h4>
          <Button 
            onClick={() => copyEmbedCode(getEmbedCode())}
            size="sm" 
            variant="outline"
            className="flex items-center space-x-1"
          >
            <Copy className="h-3 w-3" />
            <span>Copy Code</span>
          </Button>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="html"
            value={getEmbedCode()}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              theme: 'vs-light'
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Implementation Notes</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <strong>Before going live:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>Test the widget on your website in a staging environment</li>
              <li>Ensure it works across different devices and browsers</li>
              <li>Check that it doesn't conflict with existing CSS/JavaScript</li>
              <li>Verify the assistant responds correctly to test messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 