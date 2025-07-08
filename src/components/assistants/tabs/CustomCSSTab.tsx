'use client';

import { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import Editor from '@monaco-editor/react';
import { toast } from "sonner";
import { generateCSSFromStyle } from '@/utils/cssGeneration';

interface CustomCSSTabProps {
  embedStyle: any;
  setEmbedStyle: (setter: (prev: any) => any) => void;
}

export default function CustomCSSTab({ embedStyle, setEmbedStyle }: CustomCSSTabProps) {
  const [cssContent, setCssContent] = useState('');

  // Generate complete CSS when embedStyle changes (from other tabs)
  useEffect(() => {
    const generatedCSS = generateCSSFromStyle(embedStyle);
    const customCSS = embedStyle.customCSS || '';
    
    // Extract only the custom CSS part if it exists
    const customCSSOnly = customCSS.includes('/* Your Custom CSS */') 
      ? customCSS.split('/* Your Custom CSS */')[1]?.trim() || ''
      : customCSS;
    
    // Create complete CSS with generated + custom
    const completeCss = customCSSOnly 
      ? `${generatedCSS}\n\n/* Your Custom CSS */\n${customCSSOnly}` 
      : generatedCSS;
    
    setCssContent(completeCss);
  }, [
    embedStyle.bubbleColor,
    embedStyle.userMessageBubbleColor,
    embedStyle.assistantMessageBubbleColor,
    embedStyle.chatBackgroundColor,
    embedStyle.googleFont,
    embedStyle.borderRadius,
    embedStyle.opacity,
    embedStyle.glassEffect,
    embedStyle.backgroundPattern,
    embedStyle.animation,
    embedStyle.chatSize,
    embedStyle.selectedTheme
  ]);

  // Update embedStyle when CSS content changes (real-time preview)
  useEffect(() => {
    setEmbedStyle(prev => ({ 
      ...prev, 
      fullCSS: cssContent
    }));
  }, [cssContent]);

  const handleCSSChange = (value: string | undefined) => {
    setCssContent(value || '');
  };

  const copyCSS = async () => {
    try {
      await navigator.clipboard.writeText(cssContent);
      toast.success("CSS copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy CSS");
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* CSS Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold text-gray-700">Complete CSS</Label>
            <p className="text-xs text-gray-500 mt-1">
              This includes generated CSS from your settings plus any custom CSS you add. Changes appear in real-time.
            </p>
          </div>
          <Button
            onClick={copyCSS}
            variant="outline"
            size="sm"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy CSS
          </Button>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="css"
            value={cssContent}
            onChange={handleCSSChange}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              theme: 'vs-light',
              formatOnPaste: true,
              formatOnType: true
            }}
          />
        </div>
      </div>

      {/* CSS Class Reference */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">CSS Class Reference</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-xs">
          <div><code className="bg-white px-2 py-1 rounded">.executa-chat-widget</code> - Main chat window container</div>
          <div><code className="bg-white px-2 py-1 rounded">.executa-chat-header</code> - Chat header section</div>
          <div><code className="bg-white px-2 py-1 rounded">.executa-chat-messages</code> - Messages container</div>
          <div><code className="bg-white px-2 py-1 rounded">.executa-message-user</code> - User message bubbles</div>
          <div><code className="bg-white px-2 py-1 rounded">.executa-message-assistant</code> - Assistant message bubbles</div>
          <div><code className="bg-white px-2 py-1 rounded">.executa-chat-input</code> - Input area container</div>
          <div><code className="bg-white px-2 py-1 rounded">.executa-avatar</code> - Assistant avatar</div>
          <div><code className="bg-white px-2 py-1 rounded">.executa-chat-bubble</code> - Chat button bubble</div>
        </div>
      </div>

      {/* Example CSS */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Example CSS</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono">
          <div className="text-gray-400">/* Add a subtle shadow to message bubbles */</div>
          <div><span className="text-yellow-400">.executa-message-user</span>, <span className="text-yellow-400">.executa-message-assistant</span> {'{'}</div>
          <div className="ml-4 text-blue-300">box-shadow: 0 2px 8px rgba(0,0,0,0.1);</div>
          <div>{'}'}</div>
          <br/>
          
          <div className="text-gray-400">/* Customize the chat button hover effect */</div>
          <div><span className="text-yellow-400">.executa-chat-bubble:hover</span> {'{'}</div>
          <div className="ml-4 text-blue-300">transform: scale(1.1);</div>
          <div className="ml-4 text-blue-300">transition: transform 0.2s ease;</div>
          <div>{'}'}</div>
          <br/>
          
          <div className="text-gray-400">/* Style the typing indicator */</div>
          <div><span className="text-yellow-400">.executa-typing-indicator</span> {'{'}</div>
          <div className="ml-4 text-blue-300">animation: pulse 1.5s infinite;</div>
          <div>{'}'}</div>
        </div>
      </div>

      <div className="text-xs text-gray-500 p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <strong>Note:</strong> Custom CSS will override the theme styles. Test thoroughly to ensure compatibility across different browsers and devices.
      </div>
    </div>
  );
} 