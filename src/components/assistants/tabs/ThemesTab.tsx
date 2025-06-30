'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Settings, Sparkles, Palette, Wand2, Paintbrush } from "lucide-react";
import { themePresets } from '@/constants/embedThemes';
import { extractColorsClientSide } from '@/utils/brandColorExtraction';

interface ThemesTabProps {
  embedStyle: any;
  setEmbedStyle: (setter: (prev: any) => any) => void;
  applyThemePreset: (themeId: string) => void;
  applyExtractedColors: (colors: string[]) => void;
  user: any;
}

export default function ThemesTab({ 
  embedStyle, 
  setEmbedStyle, 
  applyThemePreset, 
  applyExtractedColors, 
  user 
}: ThemesTabProps) {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractBrandColors = async () => {
    if (!user?.website) {
      alert('Please add your website URL in settings first');
      return;
    }

    setIsExtracting(true);
    try {
      // Try server-side extraction first
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/extract-brand-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: user.website })
      });

      let colors = [];
      if (response.ok) {
        const data = await response.json();
        colors = data.colors || [];
      }

      // Fallback to client-side extraction
      if (colors.length === 0) {
        colors = await extractColorsClientSide(user.website);
      }

      if (colors.length > 0) {
        applyExtractedColors(colors);
      } else {
        alert('Could not extract colors from your website. Please try a different URL or contact support.');
      }
    } catch (error) {
      console.error('Brand color extraction failed:', error);
      alert('Failed to extract colors. Please check your website URL and try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Brand Color Extraction */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">🎨 Smart Brand Color Extraction</h4>
            <p className="text-xs text-gray-600">
              {user?.website 
                ? `Extract colors from ${user.website} to match your brand` 
                : 'Add your website URL in settings to extract brand colors'
              }
            </p>
          </div>
          <Button
            onClick={extractBrandColors}
            disabled={!user?.website || isExtracting}
            size="sm"
            className="flex items-center space-x-1"
          >
            <Paintbrush className="h-4 w-4 mr-1" />
            {isExtracting ? 'Extracting...' : 'Extract Colors'}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Theme Presets</h4>
        <div className="text-xs text-gray-500">Choose from 25+ professionally designed themes</div>
      </div>
      
      {/* Categorized Theme Selection */}
      <div className="space-y-6">
        {/* General Themes */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            General
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(themePresets)
              .filter(([_, theme]) => theme.category === 'general')
              .map(([themeId, theme]) => (
                <button
                  key={themeId}
                  onClick={() => applyThemePreset(themeId)}
                  className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                    embedStyle.selectedTheme === themeId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.bubbleColor }}
                      />
                      <span className="text-sm font-medium">{theme.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.userMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.assistantMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.chatBackgroundColor }}
                      />
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Industry Themes */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 flex items-center">
            <Settings className="h-3 w-3 mr-1" />
            Industry
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(themePresets)
              .filter(([_, theme]) => theme.category === 'industry')
              .map(([themeId, theme]) => (
                <button
                  key={themeId}
                  onClick={() => applyThemePreset(themeId)}
                  className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                    embedStyle.selectedTheme === themeId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.bubbleColor }}
                      />
                      <span className="text-sm font-medium">{theme.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.userMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.assistantMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.chatBackgroundColor }}
                      />
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Seasonal Themes */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 flex items-center">
            <Palette className="h-3 w-3 mr-1" />
            Seasonal
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(themePresets)
              .filter(([_, theme]) => theme.category === 'seasonal')
              .map(([themeId, theme]) => (
                <button
                  key={themeId}
                  onClick={() => applyThemePreset(themeId)}
                  className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                    embedStyle.selectedTheme === themeId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.bubbleColor }}
                      />
                      <span className="text-sm font-medium">{theme.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.userMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.assistantMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.chatBackgroundColor }}
                      />
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Brand-Inspired Themes */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 flex items-center">
            <Wand2 className="h-3 w-3 mr-1" />
            Brand-Inspired
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(themePresets)
              .filter(([_, theme]) => theme.category === 'brand')
              .map(([themeId, theme]) => (
                <button
                  key={themeId}
                  onClick={() => applyThemePreset(themeId)}
                  className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                    embedStyle.selectedTheme === themeId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.bubbleColor }}
                      />
                      <span className="text-sm font-medium">{theme.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.userMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.assistantMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.chatBackgroundColor }}
                      />
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Accessibility Themes */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            Accessibility
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(themePresets)
              .filter(([_, theme]) => theme.category === 'accessibility')
              .map(([themeId, theme]) => (
                <button
                  key={themeId}
                  onClick={() => applyThemePreset(themeId)}
                  className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                    embedStyle.selectedTheme === themeId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.bubbleColor }}
                      />
                      <span className="text-sm font-medium">{theme.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.userMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.assistantMessageBubbleColor }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.chatBackgroundColor }}
                      />
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        💡 <strong>Pro Tip:</strong> Choose a theme as your starting point, then customize colors, fonts, and animations in the other tabs. All themes are fully customizable!
      </div>
    </div>
  );
} 