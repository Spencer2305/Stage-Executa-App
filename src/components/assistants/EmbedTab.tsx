'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, Eye, RotateCcw, Maximize, X } from "lucide-react";
import { toast } from "sonner";

// Import modular components
import { themePresets } from '@/constants/embedThemes';
import { lightenColor } from '@/utils/brandColorExtraction';
import ChatPreviewComponent from '@/components/assistants/ChatPreviewComponent';
import LivePreviewChatWidget from '@/components/assistants/LivePreviewChatWidget';
import BasicTab from '@/components/assistants/tabs/BasicTab';
import ThemesTab from '@/components/assistants/tabs/ThemesTab';
import AdvancedTab from '@/components/assistants/tabs/AdvancedTab';
import CustomCSSTab from '@/components/assistants/tabs/CustomCSSTab';
import EmbedCodeTab from '@/components/assistants/tabs/EmbedCodeTab';

interface EmbedTabProps {
  assistant: any;
  user: any;
}

export default function EmbedTab({ assistant, user }: EmbedTabProps) {
  // Extract advanced settings from handoffSettings if they exist
  const advancedSettings = assistant?.handoffSettings?.embedAdvanced || {};
  
  const [embedStyle, setEmbedStyle] = useState({
    bubbleColor: assistant?.embedBubbleColor || "#3B82F6",
    buttonShape: assistant?.embedButtonShape || "rounded",
    fontStyle: assistant?.embedFontStyle || "system",
    position: assistant?.embedPosition || "bottom-right",
    chatBackgroundColor: assistant?.chatBackgroundColor || "#FFFFFF",
    userMessageBubbleColor: assistant?.userMessageBubbleColor || "#3B82F6",
    assistantMessageBubbleColor: assistant?.assistantMessageBubbleColor || "#F3F4F6",
    assistantFontStyle: assistant?.assistantFontStyle || "sans",
    messageBubbleRadius: assistant?.messageBubbleRadius || 12,
    showAssistantAvatar: assistant?.showAssistantAvatar !== false,
    assistantAvatarIcon: assistant?.assistantAvatarUrl || "robot",
    showChatHeader: assistant?.showChatHeader !== false,
    chatHeaderTitle: assistant?.chatHeaderTitle || "AI Assistant",
    welcomeMessage: assistant?.welcomeMessage || "",
    // Advanced styling options - now properly loaded from handoffSettings.embedAdvanced
    selectedTheme: advancedSettings.selectedTheme || 'custom',
    chatHeaderGradient: advancedSettings.chatHeaderGradient || 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    backgroundPattern: advancedSettings.backgroundPattern || 'none',
    glassEffect: advancedSettings.glassEffect || false,
    animation: advancedSettings.animation || 'smooth',
    customCSS: advancedSettings.customCSS || '',
    googleFont: advancedSettings.googleFont || 'inter',
    chatSize: advancedSettings.chatSize || 'standard',
    shadowIntensity: advancedSettings.shadowIntensity || 'medium',
    borderRadius: advancedSettings.borderRadius || 12,
    opacity: advancedSettings.opacity || 100
  });
  
  const [isSavingStyles, setIsSavingStyles] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [activeStyleTab, setActiveStyleTab] = useState<'basic' | 'themes' | 'advanced' | 'custom' | 'embed'>('basic');

  // Apply theme preset
  const applyThemePreset = async (themeId: string) => {
    if (themeId === 'custom') return;
    
    const theme = themePresets[themeId as keyof typeof themePresets];
    if (!theme) return;

    const newEmbedStyle = {
      ...embedStyle,
      selectedTheme: themeId,
      bubbleColor: theme.bubbleColor,
      chatBackgroundColor: theme.chatBackgroundColor,
      userMessageBubbleColor: theme.userMessageBubbleColor,
      assistantMessageBubbleColor: theme.assistantMessageBubbleColor,
      chatHeaderGradient: theme.chatHeaderGradient,
      backgroundPattern: theme.backgroundPattern,
      glassEffect: theme.glassEffect,
      animation: theme.animation
    };
    
    setEmbedStyle(prev => ({
      ...prev,
      selectedTheme: themeId,
      bubbleColor: theme.bubbleColor,
      chatBackgroundColor: theme.chatBackgroundColor,
      userMessageBubbleColor: theme.userMessageBubbleColor,
      assistantMessageBubbleColor: theme.assistantMessageBubbleColor,
      chatHeaderGradient: theme.chatHeaderGradient,
      backgroundPattern: theme.backgroundPattern,
      glassEffect: theme.glassEffect,
      animation: theme.animation
    }));
    
    // Automatically save the theme to the database
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch(`/api/models/${assistant.id}/embed-styles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEmbedStyle)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Theme Auto-save API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save theme`);
      }

      toast.success(`Applied and saved ${theme.name} theme`);
    } catch (error) {
      console.error('Auto-save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Applied ${theme.name} theme but failed to save: ${errorMessage}. Please click 'Save Styles' manually.`);
    }
  };

  // Apply extracted colors
  const applyExtractedColors = (colors: string[]) => {
    if (colors.length >= 2) {
      const primaryColor = colors[0];
      const secondaryColor = colors[1] || primaryColor;
      const lightColor = lightenColor(primaryColor, 0.9);
      
      setEmbedStyle(prev => ({
        ...prev,
        selectedTheme: 'custom',
        bubbleColor: primaryColor,
        userMessageBubbleColor: primaryColor,
        assistantMessageBubbleColor: lightColor,
        chatHeaderGradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
      }));
      
      toast.success(`Applied brand colors from your website!`);
    }
  };

  // Save embed styles
  const saveEmbedStyles = async () => {
    setIsSavingStyles(true);
    try {
      console.log('Saving embed styles:', embedStyle);
      console.log('Assistant ID:', assistant.id);
      
      const token = localStorage.getItem('executa-auth-token');
      console.log('Token exists:', !!token);
      
      const response = await fetch(`/api/models/${assistant.id}/embed-styles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(embedStyle)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save embed styles`);
      }

      const successData = await response.json();
      console.log('Success response:', successData);
      toast.success("Embed styles saved successfully!");
    } catch (error) {
      console.error('Save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save embed styles: ${errorMessage}`);
    } finally {
      setIsSavingStyles(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setEmbedStyle({
      bubbleColor: "#3B82F6",
      buttonShape: "rounded",
      fontStyle: "system",
      position: "bottom-right",
      chatBackgroundColor: "#FFFFFF",
      userMessageBubbleColor: "#3B82F6",
      assistantMessageBubbleColor: "#F3F4F6",
      assistantFontStyle: "sans",
      messageBubbleRadius: 12,
      showAssistantAvatar: true,
      assistantAvatarIcon: "robot",
      showChatHeader: true,
      chatHeaderTitle: "AI Assistant",
      welcomeMessage: "",
      selectedTheme: 'modern-blue',
      chatHeaderGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      backgroundPattern: 'none',
      glassEffect: false,
      animation: 'smooth',
      customCSS: '',
      googleFont: 'inter',
      chatSize: 'standard',
      shadowIntensity: 'medium',
      borderRadius: 12,
      opacity: 100
    });
    toast.success("Reset to default settings");
  };

  // Load Google Fonts dynamically
  useEffect(() => {
    if (embedStyle.googleFont && embedStyle.googleFont !== 'inter') {
      const fontMap: Record<string, string> = {
        'roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
        'open-sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap',
        'poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
        'lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
        'montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
        'nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
        'source-sans': 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap'
      };
      
      if (fontMap[embedStyle.googleFont]) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontMap[embedStyle.googleFont];
        document.head.appendChild(link);
      }
    }
  }, [embedStyle.googleFont]);

  // Escape key handler for fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenPreview) {
        setIsFullscreenPreview(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreenPreview]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Embed Chat Widget</h3>
          <p className="text-sm text-gray-600">Customize and deploy your AI chat widget</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={resetToDefaults} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button onClick={saveEmbedStyles} disabled={isSavingStyles} size="sm">
            {isSavingStyles ? "Saving..." : "Save Styles"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Palette className="h-4 w-4 mr-2" />
              Customize Appearance
            </CardTitle>
            <CardDescription>Style your chat widget to match your brand</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeStyleTab} onValueChange={(value) => setActiveStyleTab(value as any)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="themes">Themes</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="custom">CSS</TabsTrigger>
                <TabsTrigger value="embed">Code</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[600px] pr-4">
                <TabsContent value="basic">
                  <BasicTab embedStyle={embedStyle} setEmbedStyle={setEmbedStyle} />
                </TabsContent>
                
                <TabsContent value="themes">
                  <ThemesTab 
                    embedStyle={embedStyle} 
                    setEmbedStyle={setEmbedStyle}
                    applyThemePreset={applyThemePreset}
                    applyExtractedColors={applyExtractedColors}
                    user={user}
                  />
                </TabsContent>
                
                <TabsContent value="advanced">
                  <AdvancedTab embedStyle={embedStyle} setEmbedStyle={setEmbedStyle} />
                </TabsContent>
                
                <TabsContent value="custom">
                  <CustomCSSTab embedStyle={embedStyle} setEmbedStyle={setEmbedStyle} />
                </TabsContent>
                
                <TabsContent value="embed">
                  <EmbedCodeTab embedStyle={embedStyle} assistant={assistant} />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Panel - Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Live Preview
              </div>
              <Button 
                onClick={() => setIsFullscreenPreview(true)}
                variant="outline" 
                size="sm"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>See how your widget will look on your website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ChatPreviewComponent embedStyle={embedStyle} />
            </div>
            
            {/* Live Interactive Widget */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Interactive Preview</h4>
              <div className="relative bg-gray-50 rounded-lg p-6 min-h-[200px]">
                <div className="absolute bottom-4 right-4">
                  <LivePreviewChatWidget embedStyle={embedStyle} assistant={assistant} />
                </div>
                <div className="text-center text-gray-500 text-sm">
                  Your website background
                  <br />
                  <span className="text-xs">Click the chat button to test →</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Fullscreen Preview</h3>
              <Button onClick={() => setIsFullscreenPreview(false)} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              <ChatPreviewComponent embedStyle={embedStyle} isFullscreen={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 