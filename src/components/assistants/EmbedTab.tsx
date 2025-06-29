'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Eye, Code, Copy, RotateCcw, Download, MessageSquare, Send, ExternalLink, Globe, Settings, Sparkles, Paintbrush, Wand2, Layers, Type, Zap, Maximize, X } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Editor from '@monaco-editor/react';
import { 
  faRobot, 
  faUser, 
  faUserTie, 
  faHeadset, 
  faCog, 
  faLightbulb, 
  faHeart, 
  faStar, 
  faThumbsUp, 
  faShield, 
  faGraduationCap, 
  faBriefcase, 
  faHome, 
  faPhone, 
  faEnvelope,
  faComment,
  faComments,
  faInfoCircle,
  faQuestionCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { toast } from "sonner";

// Avatar icon options for Font Awesome
const avatarIcons = [
  { id: 'robot', icon: faRobot, label: 'Robot' },
  { id: 'user', icon: faUser, label: 'User' },
  { id: 'user-tie', icon: faUserTie, label: 'Professional' },
  { id: 'headset', icon: faHeadset, label: 'Support Agent' },
  { id: 'cog', icon: faCog, label: 'Technical' },
  { id: 'lightbulb', icon: faLightbulb, label: 'Ideas' },
  { id: 'heart', icon: faHeart, label: 'Friendly' },
  { id: 'star', icon: faStar, label: 'Premium' },
  { id: 'thumbs-up', icon: faThumbsUp, label: 'Helpful' },
  { id: 'shield', icon: faShield, label: 'Security' },
  { id: 'graduation-cap', icon: faGraduationCap, label: 'Education' },
  { id: 'briefcase', icon: faBriefcase, label: 'Business' },
  { id: 'home', icon: faHome, label: 'Home' },
  { id: 'phone', icon: faPhone, label: 'Contact' },
  { id: 'envelope', icon: faEnvelope, label: 'Messages' },
  { id: 'comment', icon: faComment, label: 'Chat' },
  { id: 'comments', icon: faComments, label: 'Discussion' },
  { id: 'info-circle', icon: faInfoCircle, label: 'Information' },
  { id: 'question-circle', icon: faQuestionCircle, label: 'Help' },
  { id: 'exclamation-circle', icon: faExclamationCircle, label: 'Important' },
];

// Theme Presets
const themePresets = {
  // ===== GENERAL THEMES =====
  'modern-blue': {
    name: 'Modern Blue',
    category: 'general',
    bubbleColor: '#3B82F6',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#3B82F6',
    assistantMessageBubbleColor: '#F1F5F9',
    chatHeaderGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    backgroundPattern: 'none',
    glassEffect: false,
    animation: 'smooth'
  },
  'dark-mode': {
    name: 'Dark Mode',
    category: 'general',
    bubbleColor: '#3B82F6',
    chatBackgroundColor: '#1F2937',
    userMessageBubbleColor: '#3B82F6',
    assistantMessageBubbleColor: '#374151',
    chatHeaderGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    backgroundPattern: 'none',
    glassEffect: true,
    animation: 'smooth'
  },
  'glassmorphism': {
    name: 'Glassmorphism',
    category: 'general',
    bubbleColor: 'rgba(255, 255, 255, 0.25)',
    chatBackgroundColor: 'rgba(255, 255, 255, 0.1)',
    userMessageBubbleColor: 'rgba(59, 130, 246, 0.8)',
    assistantMessageBubbleColor: 'rgba(255, 255, 255, 0.2)',
    chatHeaderGradient: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
    backgroundPattern: 'blur',
    glassEffect: true,
    animation: 'smooth'
  },

  // ===== INDUSTRY THEMES =====
  'ecommerce': {
    name: 'E-commerce',
    category: 'industry',
    bubbleColor: '#10B981',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#10B981',
    assistantMessageBubbleColor: '#ECFDF5',
    chatHeaderGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    backgroundPattern: 'dots',
    glassEffect: false,
    animation: 'bounce'
  },
  'healthcare': {
    name: 'Healthcare',
    category: 'industry',
    bubbleColor: '#0EA5E9',
    chatBackgroundColor: '#FAFBFB',
    userMessageBubbleColor: '#0EA5E9',
    assistantMessageBubbleColor: '#E0F2FE',
    chatHeaderGradient: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    backgroundPattern: 'none',
    glassEffect: true,
    animation: 'fade'
  },
  'finance': {
    name: 'Finance',
    category: 'industry',
    bubbleColor: '#1F2937',
    chatBackgroundColor: '#F9FAFB',
    userMessageBubbleColor: '#1F2937',
    assistantMessageBubbleColor: '#F3F4F6',
    chatHeaderGradient: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
    backgroundPattern: 'grid',
    glassEffect: false,
    animation: 'slide'
  },
  'education': {
    name: 'Education',
    category: 'industry',
    bubbleColor: '#8B5CF6',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#8B5CF6',
    assistantMessageBubbleColor: '#F3E8FF',
    chatHeaderGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    backgroundPattern: 'waves',
    glassEffect: false,
    animation: 'smooth'
  },
  'real-estate': {
    name: 'Real Estate',
    category: 'industry',
    bubbleColor: '#DC2626',
    chatBackgroundColor: '#FFFBEB',
    userMessageBubbleColor: '#DC2626',
    assistantMessageBubbleColor: '#FEF3C7',
    chatHeaderGradient: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    backgroundPattern: 'diagonal',
    glassEffect: false,
    animation: 'smooth'
  },
  'legal': {
    name: 'Legal',
    category: 'industry',
    bubbleColor: '#1E40AF',
    chatBackgroundColor: '#F8FAFC',
    userMessageBubbleColor: '#1E40AF',
    assistantMessageBubbleColor: '#E2E8F0',
    chatHeaderGradient: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
    backgroundPattern: 'grid',
    glassEffect: false,
    animation: 'slide'
  },
  'travel': {
    name: 'Travel',
    category: 'industry',
    bubbleColor: '#0891B2',
    chatBackgroundColor: '#F0F9FF',
    userMessageBubbleColor: '#0891B2',
    assistantMessageBubbleColor: '#E0F7FA',
    chatHeaderGradient: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    backgroundPattern: 'waves',
    glassEffect: true,
    animation: 'bounce'
  },
  'food-beverage': {
    name: 'Food & Beverage',
    category: 'industry',
    bubbleColor: '#EA580C',
    chatBackgroundColor: '#FFF7ED',
    userMessageBubbleColor: '#EA580C',
    assistantMessageBubbleColor: '#FFEDD5',
    chatHeaderGradient: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
    backgroundPattern: 'dots',
    glassEffect: false,
    animation: 'bounce'
  },

  // ===== SEASONAL THEMES =====
  'christmas': {
    name: 'Christmas',
    category: 'seasonal',
    bubbleColor: '#DC2626',
    chatBackgroundColor: '#FEF2F2',
    userMessageBubbleColor: '#DC2626',
    assistantMessageBubbleColor: '#DCFCE7',
    chatHeaderGradient: 'linear-gradient(135deg, #DC2626 0%, #16A34A 100%)',
    backgroundPattern: 'dots',
    glassEffect: false,
    animation: 'bounce'
  },
  'halloween': {
    name: 'Halloween',
    category: 'seasonal',
    bubbleColor: '#EA580C',
    chatBackgroundColor: '#1C1917',
    userMessageBubbleColor: '#EA580C',
    assistantMessageBubbleColor: '#292524',
    chatHeaderGradient: 'linear-gradient(135deg, #EA580C 0%, #000000 100%)',
    backgroundPattern: 'diagonal',
    glassEffect: true,
    animation: 'bounce'
  },
  'summer': {
    name: 'Summer',
    category: 'seasonal',
    bubbleColor: '#FBBF24',
    chatBackgroundColor: '#FFFBEB',
    userMessageBubbleColor: '#FBBF24',
    assistantMessageBubbleColor: '#FEF3C7',
    chatHeaderGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    backgroundPattern: 'waves',
    glassEffect: false,
    animation: 'smooth'
  },
  'spring': {
    name: 'Spring',
    category: 'seasonal',
    bubbleColor: '#10B981',
    chatBackgroundColor: '#F0FDF4',
    userMessageBubbleColor: '#10B981',
    assistantMessageBubbleColor: '#DCFCE7',
    chatHeaderGradient: 'linear-gradient(135deg, #10B981 0%, #EC4899 100%)',
    backgroundPattern: 'dots',
    glassEffect: false,
    animation: 'bounce'
  },
  'winter': {
    name: 'Winter',
    category: 'seasonal',
    bubbleColor: '#0EA5E9',
    chatBackgroundColor: '#F0F9FF',
    userMessageBubbleColor: '#0EA5E9',
    assistantMessageBubbleColor: '#E0F2FE',
    chatHeaderGradient: 'linear-gradient(135deg, #0EA5E9 0%, #64748B 100%)',
    backgroundPattern: 'grid',
    glassEffect: true,
    animation: 'fade'
  },
  'valentines': {
    name: "Valentine's Day",
    category: 'seasonal',
    bubbleColor: '#EC4899',
    chatBackgroundColor: '#FDF2F8',
    userMessageBubbleColor: '#EC4899',
    assistantMessageBubbleColor: '#FCE7F3',
    chatHeaderGradient: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    backgroundPattern: 'dots',
    glassEffect: false,
    animation: 'bounce'
  },

  // ===== BRAND-INSPIRED THEMES =====
  'apple-style': {
    name: 'Apple Style',
    category: 'brand',
    bubbleColor: '#007AFF',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#007AFF',
    assistantMessageBubbleColor: '#F2F2F7',
    chatHeaderGradient: 'linear-gradient(135deg, #007AFF 0%, #005CBB 100%)',
    backgroundPattern: 'none',
    glassEffect: true,
    animation: 'smooth'
  },
  'google-material': {
    name: 'Google Material',
    category: 'brand',
    bubbleColor: '#4285F4',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#4285F4',
    assistantMessageBubbleColor: '#F8F9FA',
    chatHeaderGradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
    backgroundPattern: 'none',
    glassEffect: false,
    animation: 'slide'
  },
  'github-style': {
    name: 'GitHub Style',
    category: 'brand',
    bubbleColor: '#24292F',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#24292F',
    assistantMessageBubbleColor: '#F6F8FA',
    chatHeaderGradient: 'linear-gradient(135deg, #24292F 0%, #0969DA 100%)',
    backgroundPattern: 'grid',
    glassEffect: false,
    animation: 'smooth'
  },
  'slack-style': {
    name: 'Slack Style',
    category: 'brand',
    bubbleColor: '#4A154B',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#4A154B',
    assistantMessageBubbleColor: '#F4EDF4',
    chatHeaderGradient: 'linear-gradient(135deg, #4A154B 0%, #ECB22E 100%)',
    backgroundPattern: 'none',
    glassEffect: false,
    animation: 'bounce'
  },
  'discord-style': {
    name: 'Discord Style',
    category: 'brand',
    bubbleColor: '#5865F2',
    chatBackgroundColor: '#36393F',
    userMessageBubbleColor: '#5865F2',
    assistantMessageBubbleColor: '#40444B',
    chatHeaderGradient: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
    backgroundPattern: 'none',
    glassEffect: false,
    animation: 'smooth'
  },

  // ===== ACCESSIBILITY THEMES =====
  'high-contrast': {
    name: 'High Contrast',
    category: 'accessibility',
    bubbleColor: '#000000',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#000000',
    assistantMessageBubbleColor: '#F3F4F6',
    chatHeaderGradient: 'linear-gradient(135deg, #000000 0%, #374151 100%)',
    backgroundPattern: 'none',
    glassEffect: false,
    animation: 'none'
  },
  'large-text': {
    name: 'Large Text',
    category: 'accessibility',
    bubbleColor: '#1F2937',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#1F2937',
    assistantMessageBubbleColor: '#F9FAFB',
    chatHeaderGradient: 'linear-gradient(135deg, #1F2937 0%, #4B5563 100%)',
    backgroundPattern: 'none',
    glassEffect: false,
    animation: 'smooth'
  },
  'colorblind-friendly': {
    name: 'Colorblind Friendly',
    category: 'accessibility',
    bubbleColor: '#0F4C75',
    chatBackgroundColor: '#FFFFFF',
    userMessageBubbleColor: '#0F4C75',
    assistantMessageBubbleColor: '#E5E7EB',
    chatHeaderGradient: 'linear-gradient(135deg, #0F4C75 0%, #3282B8 100%)',
    backgroundPattern: 'grid',
    glassEffect: false,
    animation: 'smooth'
  },
  'low-vision': {
    name: 'Low Vision',
    category: 'accessibility',
    bubbleColor: '#1E3A8A',
    chatBackgroundColor: '#F8FAFC',
    userMessageBubbleColor: '#1E3A8A',
    assistantMessageBubbleColor: '#E2E8F0',
    chatHeaderGradient: 'linear-gradient(135deg, #1E3A8A 0%, #3730A3 100%)',
    backgroundPattern: 'none',
    glassEffect: false,
    animation: 'smooth'
  }
};

// Google Fonts options
const googleFonts = [
  { id: 'inter', name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { id: 'roboto', name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
  { id: 'open-sans', name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { id: 'poppins', name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { id: 'lato', name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { id: 'montserrat', name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { id: 'nunito', name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' },
  { id: 'source-sans', name: 'Source Sans Pro', url: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap' }
];

// Background patterns
const backgroundPatterns = [
  { id: 'none', name: 'None', css: '' },
  { id: 'dots', name: 'Dots', css: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' },
  { id: 'grid', name: 'Grid', css: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' },
  { id: 'waves', name: 'Waves', css: 'linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%)', backgroundSize: '30px 30px' },
  { id: 'diagonal', name: 'Diagonal Lines', css: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 10px)', backgroundSize: 'auto' }
];

// Animation options
const animationOptions = [
  { id: 'none', name: 'None', css: '' },
  { id: 'smooth', name: 'Smooth', css: 'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);' },
  { id: 'bounce', name: 'Bounce', css: 'transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);' },
  { id: 'slide', name: 'Slide', css: 'transition: all 0.4s ease-in-out;' },
  { id: 'fade', name: 'Fade', css: 'transition: opacity 0.3s ease, transform 0.3s ease;' }
];

// Chat window sizes
const chatSizes = [
  { id: 'compact', name: 'Compact', width: '300px', height: '400px' },
  { id: 'standard', name: 'Standard', width: '350px', height: '450px' },
  { id: 'large', name: 'Large', width: '400px', height: '500px' },
  { id: 'full-height', name: 'Full Height', width: '350px', height: '80vh' }
];

interface EmbedTabProps {
  assistant: any;
  user: any;
}

export default function EmbedTab({ assistant, user }: EmbedTabProps) {
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
    // Advanced styling options
    selectedTheme: assistant?.selectedTheme || 'custom',
    chatHeaderGradient: assistant?.chatHeaderGradient || 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    backgroundPattern: assistant?.backgroundPattern || 'none',
    glassEffect: assistant?.glassEffect || false,
    animation: assistant?.animation || 'smooth',
    customCSS: assistant?.customCSS || '',
    googleFont: assistant?.googleFont || 'inter',
    chatSize: assistant?.chatSize || 'standard',
    shadowIntensity: assistant?.shadowIntensity || 'medium',
    borderRadius: assistant?.borderRadius || 12,
    opacity: assistant?.opacity || 100
  });
  
  const [embedCodeType, setEmbedCodeType] = useState<'styled' | 'raw' | 'wordpress'>('styled');
  const [isSavingStyles, setIsSavingStyles] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [activeStyleTab, setActiveStyleTab] = useState<'basic' | 'themes' | 'advanced' | 'custom'>('basic');

  // Apply theme preset
  const applyThemePreset = (themeId: string) => {
    if (themeId === 'custom') return;
    
    const theme = themePresets[themeId as keyof typeof themePresets];
    if (!theme) return;

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
    toast.success(`Applied ${theme.name} theme`);
  };

  // Extract colors from website
  const extractBrandColors = async () => {
    if (!user?.website) {
      toast.error("No website URL found in your profile");
      return;
    }
    
    const extractingToast = toast.loading("Extracting brand colors from your website...");
    
    try {
      // Clean up the URL
      let websiteUrl = user.website;
      if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      // Method 1: Try our own color extraction endpoint
      try {
        const token = localStorage.getItem('executa-auth-token');
        const response = await fetch('/api/extract-brand-colors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ url: websiteUrl }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.colors && data.colors.length > 0) {
            applyExtractedColors(data.colors);
            toast.dismiss(extractingToast);
            toast.success(`Extracted ${data.colors.length} colors from your website!`);
            return;
          }
        }
      } catch (error) {
        console.log('Method 1 failed, trying fallback methods');
      }
      
      // Method 2: Client-side approach using ColorThief-like logic
      const extractedColors = await extractColorsClientSide(websiteUrl);
      if (extractedColors.length > 0) {
        applyExtractedColors(extractedColors);
        toast.dismiss(extractingToast);
        toast.success(`Extracted ${extractedColors.length} colors from your website!`);
        return;
      }
      
      // Method 3: Manual color suggestions based on common patterns
      const suggestedColors = await suggestColorsFromDomain(websiteUrl);
      applyExtractedColors(suggestedColors);
      toast.dismiss(extractingToast);
      toast.success("Applied suggested brand colors based on your domain!");
      
    } catch (error) {
      console.error('Color extraction error:', error);
      toast.dismiss(extractingToast);
      toast.error("Unable to extract colors. Please try again or set colors manually.");
    }
  };
  
  // Apply extracted colors to the widget
  const applyExtractedColors = (colors: string[]) => {
    if (colors.length === 0) return;
    
    setEmbedStyle(prev => ({
      ...prev,
      selectedTheme: 'custom',
      bubbleColor: colors[0] || prev.bubbleColor,
      userMessageBubbleColor: colors[0] || prev.userMessageBubbleColor,
      assistantMessageBubbleColor: colors[1] ? lightenColor(colors[1], 0.9) : prev.assistantMessageBubbleColor,
      chatHeaderGradient: colors.length >= 2 
        ? `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
        : `linear-gradient(135deg, ${colors[0]} 0%, ${lightenColor(colors[0], 0.8)} 100%)`,
      chatBackgroundColor: colors[2] ? lightenColor(colors[2], 0.95) : prev.chatBackgroundColor
    }));
  };
  
  // Client-side color extraction using canvas and image analysis
  const extractColorsClientSide = async (url: string): Promise<string[]> => {
    try {
      // Get the favicon and try to extract colors from it
      const faviconUrl = `${new URL(url).origin}/favicon.ico`;
      const colors = await extractColorsFromImage(faviconUrl);
      
      if (colors.length > 0) {
        return colors;
      }
      
      // Try common logo paths
      const logoUrls = [
        `${new URL(url).origin}/logo.png`,
        `${new URL(url).origin}/logo.svg`,
        `${new URL(url).origin}/assets/logo.png`,
        `${new URL(url).origin}/images/logo.png`,
      ];
      
      for (const logoUrl of logoUrls) {
        try {
          const logoColors = await extractColorsFromImage(logoUrl);
          if (logoColors.length > 0) {
            return logoColors;
          }
        } catch (e) {
          // Continue to next logo URL
        }
      }
      
      return [];
    } catch (error) {
      console.error('Client-side extraction failed:', error);
      return [];
    }
  };
  
  // Extract colors from an image using canvas
  const extractColorsFromImage = (imageUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve([]);
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const colors = extractDominantColors(imageData.data);
          resolve(colors);
        } catch (error) {
          console.error('Canvas extraction failed:', error);
          resolve([]);
        }
      };
      
      img.onerror = () => resolve([]);
      img.src = imageUrl;
    });
  };
  
  // Extract dominant colors from image data
  const extractDominantColors = (data: Uint8ClampedArray): string[] => {
    const colorMap = new Map<string, number>();
    
    // Sample every 10th pixel to improve performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent or very light/dark pixels
      if (a < 128 || (r + g + b) < 50 || (r + g + b) > 700) continue;
      
      const hex = rgbToHex(r, g, b);
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
    
    // Sort by frequency and return top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color)
      .slice(0, 3);
    
    return sortedColors;
  };
  
  // Suggest colors based on domain/industry patterns
  const suggestColorsFromDomain = async (url: string): Promise<string[]> => {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Industry-based color suggestions
    if (domain.includes('health') || domain.includes('medical') || domain.includes('care')) {
      return ['#0EA5E9', '#06B6D4', '#E0F2FE']; // Healthcare blues
    }
    if (domain.includes('finance') || domain.includes('bank') || domain.includes('pay')) {
      return ['#1F2937', '#374151', '#F3F4F6']; // Finance grays
    }
    if (domain.includes('shop') || domain.includes('store') || domain.includes('buy')) {
      return ['#10B981', '#059669', '#ECFDF5']; // E-commerce greens
    }
    if (domain.includes('edu') || domain.includes('school') || domain.includes('learn')) {
      return ['#8B5CF6', '#7C3AED', '#F3E8FF']; // Education purples
    }
    if (domain.includes('tech') || domain.includes('software') || domain.includes('app')) {
      return ['#3B82F6', '#1D4ED8', '#EFF6FF']; // Tech blues
    }
    
    // Default modern colors
    return ['#3B82F6', '#1D4ED8', '#F1F5F9'];
  };
  
  // Helper functions
  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  
  const lightenColor = (color: string, factor: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.round(r + (255 - r) * factor);
    const newG = Math.round(g + (255 - g) * factor);
    const newB = Math.round(b + (255 - b) * factor);
    
    return rgbToHex(newR, newG, newB);
  };

  // Helper function to properly format website URL
  const getWebsiteUrl = (website: string): string => {
    if (!website) return '';
    
    // Clean up the URL
    let url = website.trim();
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Remove any trailing slashes
    url = url.replace(/\/+$/, '');
    
    return url;
  };

  // Helper function to get appropriately scaled chat window sizes
  const getScaledChatSize = (sizeId: string) => {
    const size = chatSizes.find(s => s.id === sizeId) || chatSizes.find(s => s.id === 'standard');
    if (!size) return { width: '320px', height: '420px' };
    
    // Convert size values to numbers and scale appropriately for preview
    const width = parseInt(size.width.replace('px', '').replace('vh', ''));
    const height = size.height.includes('vh') ? 
      Math.round(window.innerHeight * 0.35) : // 35% of viewport for 'vh' units
      parseInt(size.height.replace('px', ''));
    
    return {
      width: `${Math.min(width, 380)}px`, // Cap at 380px for preview
      height: `${Math.min(height, 480)}px` // Cap at 480px for preview
    };
  };

  // Live Preview Chat Widget Component
  // Reusable Chat Preview Component
  const ChatPreviewComponent = ({ embedStyle, isFullscreen = false }: { embedStyle: any; isFullscreen?: boolean }) => {
    // Check if accessibility theme is selected for special handling
    const isLargeTextTheme = embedStyle.selectedTheme === 'large-text';
    const isHighContrastTheme = embedStyle.selectedTheme === 'high-contrast';
    
    const previewStyles = {
      backgroundColor: embedStyle.chatBackgroundColor,
      // Apply Google Font
      fontFamily: embedStyle.googleFont === 'inter' ? '"Inter", sans-serif' :
        embedStyle.googleFont === 'roboto' ? '"Roboto", sans-serif' :
        embedStyle.googleFont === 'open-sans' ? '"Open Sans", sans-serif' :
        embedStyle.googleFont === 'poppins' ? '"Poppins", sans-serif' :
        embedStyle.googleFont === 'lato' ? '"Lato", sans-serif' :
        embedStyle.googleFont === 'montserrat' ? '"Montserrat", sans-serif' :
        embedStyle.googleFont === 'nunito' ? '"Nunito", sans-serif' :
        embedStyle.googleFont === 'source-sans' ? '"Source Sans Pro", sans-serif' :
        '"Inter", sans-serif',
      // Apply chat window size - larger for fullscreen and accessibility
      maxWidth: isFullscreen ? '500px' : (isLargeTextTheme ? '400px' : (chatSizes.find(size => size.id === embedStyle.chatSize)?.width || '350px')),
      height: isFullscreen ? '600px' : (isLargeTextTheme ? '500px' : (chatSizes.find(size => size.id === embedStyle.chatSize)?.height || '450px')),
      // Apply border radius
      borderRadius: `${embedStyle.borderRadius}px`,
      // Apply opacity
      opacity: embedStyle.opacity / 100,
      // Apply glass effect
      backdropFilter: embedStyle.glassEffect ? 'blur(10px)' : 'none',
      // Apply background pattern
      backgroundImage: backgroundPatterns.find(pattern => pattern.id === embedStyle.backgroundPattern)?.css || '',
      backgroundSize: backgroundPatterns.find(pattern => pattern.id === embedStyle.backgroundPattern)?.backgroundSize || 'auto',
      // Apply animation transitions
      transition: animationOptions.find(anim => anim.id === embedStyle.animation)?.css || '',
      // Accessibility enhancements
      ...(isHighContrastTheme && {
        border: '2px solid #000000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      })
    };

    return (
      <div 
        className={`${isFullscreen ? 'mx-auto' : 'w-full mx-auto'} shadow-lg border overflow-hidden chat-preview-container executa-chat-widget`}
        style={previewStyles}
      >
        {/* Chat Header */}
        {embedStyle.showChatHeader && (
          <div 
            className="p-4 text-white flex items-center executa-chat-header"
            style={{ 
              background: embedStyle.chatHeaderGradient || `linear-gradient(90deg, ${embedStyle.bubbleColor} 0%, ${embedStyle.userMessageBubbleColor} 100%)`,
              borderRadius: `${embedStyle.borderRadius}px ${embedStyle.borderRadius}px 0 0`
            }}
          >
            <h3 className={`${isFullscreen ? 'text-lg' : (isLargeTextTheme ? 'text-lg' : 'text-base')} font-medium`}>{embedStyle.chatHeaderTitle}</h3>
          </div>
        )}

        {/* Chat Messages */}
        <div className={`p-4 space-y-3 ${isFullscreen ? 'min-h-[450px] max-h-[450px]' : 'min-h-[300px] max-h-[300px]'} overflow-y-auto executa-chat-messages`}>
          {/* Welcome Message */}
          {embedStyle.welcomeMessage && (
            <div className="flex items-start space-x-2">
              {embedStyle.showAssistantAvatar && (
                <div 
                  className={`${isFullscreen ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex-shrink-0 flex items-center justify-center executa-avatar`}
                  style={{ backgroundColor: embedStyle.bubbleColor }}
                >
                  <FontAwesomeIcon 
                    icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                    className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
                  />
                </div>
              )}
              <div 
                className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-gray-800 executa-message-assistant`}
                style={{ 
                  backgroundColor: embedStyle.assistantMessageBubbleColor,
                  borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
                }}
              >
                {embedStyle.welcomeMessage}
              </div>
            </div>
          )}

          {/* Sample User Message */}
          <div className="flex justify-end">
            <div 
              className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-white executa-message-user`}
              style={{ 
                backgroundColor: embedStyle.userMessageBubbleColor,
                borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
              }}
            >
              Hello! How can you help me?
            </div>
          </div>

          {/* Sample Assistant Response */}
          <div className="flex items-start space-x-2">
            {embedStyle.showAssistantAvatar && (
              <div 
                className={`${isFullscreen || isLargeTextTheme ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex-shrink-0 flex items-center justify-center executa-avatar`}
                style={{ backgroundColor: embedStyle.bubbleColor }}
              >
                <FontAwesomeIcon 
                  icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                  className={`${isFullscreen || isLargeTextTheme ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
                />
              </div>
            )}
            <div 
              className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-gray-800 executa-message-assistant`}
              style={{ 
                backgroundColor: embedStyle.assistantMessageBubbleColor,
                borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
              }}
            >
              I'm here to help! Feel free to ask me anything about our services.
            </div>
          </div>

          {/* Another sample exchange */}
          <div className="flex justify-end">
            <div 
              className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-white executa-message-user`}
              style={{ 
                backgroundColor: embedStyle.userMessageBubbleColor,
                borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
              }}
            >
              What are your business hours?
            </div>
          </div>

          <div className="flex items-start space-x-2">
            {embedStyle.showAssistantAvatar && (
              <div 
                className={`${isFullscreen || isLargeTextTheme ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex-shrink-0 flex items-center justify-center executa-avatar`}
                style={{ backgroundColor: embedStyle.bubbleColor }}
              >
                <FontAwesomeIcon 
                  icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                  className={`${isFullscreen || isLargeTextTheme ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
                />
              </div>
            )}
            <div 
              className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-gray-800 executa-message-assistant`}
              style={{ 
                backgroundColor: embedStyle.assistantMessageBubbleColor,
                borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
              }}
            >
              We're open Monday to Friday, 9 AM to 6 PM EST. Feel free to reach out anytime!
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200 executa-chat-input">
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              placeholder="Type your message..."
              className={`flex-1 px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500`}
              value="Type your message..."
              readOnly
            />
            <button 
              className="p-2 rounded-lg"
              style={{ backgroundColor: embedStyle.userMessageBubbleColor }}
            >
              <Send className={`${isFullscreen || isLargeTextTheme ? 'h-5 w-5' : 'h-4 w-4'} text-white`} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LivePreviewChatWidget = ({ embedStyle, assistant }: { embedStyle: any; assistant: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
      {
        type: 'assistant',
        content: embedStyle.welcomeMessage || assistant?.welcomeMessage || "Hello! How can I help you today?",
        timestamp: new Date()
      }
    ]);
    const [inputValue, setInputValue] = useState('');

    const sendMessage = () => {
      if (!inputValue.trim()) return;

      // Add user message
      const userMessage = {
        type: 'user',
        content: inputValue,
        timestamp: new Date()
      };

      // Add demo assistant response
      const assistantMessage = {
        type: 'assistant',
        content: getDemoResponse(inputValue),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setInputValue('');
    };

    const getDemoResponse = (input: string) => {
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('help') || lowerInput.includes('how')) {
        return "I'm here to help! This is a live preview of how your chat widget will work on your website.";
      }
      if (lowerInput.includes('hours') || lowerInput.includes('time')) {
        return "We're typically available Monday to Friday, 9 AM to 6 PM EST. Feel free to reach out anytime!";
      }
      if (lowerInput.includes('price') || lowerInput.includes('cost')) {
        return "I'd be happy to help you with pricing information. Let me connect you with our team for detailed pricing.";
      }
      return "Thanks for your message! This is a preview of how your AI assistant will respond to visitors on your website.";
    };

    return (
      <div>
        {/* Chat Widget Bubble */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className={`w-16 h-16 flex items-center justify-center border-none cursor-pointer shadow-lg transition-all duration-300 hover:scale-105 relative executa-chat-bubble`}
            style={{
              backgroundColor: embedStyle.bubbleColor,
              borderRadius: embedStyle.buttonShape === 'square' ? '8px' : 
                embedStyle.buttonShape === 'rounded' ? '16px' : '50%'
            }}
          >
            <MessageSquare className="h-7 w-7 text-white" />
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          </button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div 
            className="bg-white rounded-lg shadow-xl border overflow-hidden executa-chat-widget"
            style={{ 
              width: getScaledChatSize(embedStyle.chatSize).width,
              height: getScaledChatSize(embedStyle.chatSize).height,
              borderRadius: `${embedStyle.borderRadius}px`,
              opacity: embedStyle.opacity / 100,
              backdropFilter: embedStyle.glassEffect ? 'blur(10px)' : 'none',
              backgroundImage: backgroundPatterns.find(pattern => pattern.id === embedStyle.backgroundPattern)?.css || '',
              backgroundSize: backgroundPatterns.find(pattern => pattern.id === embedStyle.backgroundPattern)?.backgroundSize || 'auto',
              fontFamily: embedStyle.googleFont === 'inter' ? '"Inter", sans-serif' :
                embedStyle.googleFont === 'roboto' ? '"Roboto", sans-serif' :
                embedStyle.googleFont === 'open-sans' ? '"Open Sans", sans-serif' :
                embedStyle.googleFont === 'poppins' ? '"Poppins", sans-serif' :
                embedStyle.googleFont === 'lato' ? '"Lato", sans-serif' :
                embedStyle.googleFont === 'montserrat' ? '"Montserrat", sans-serif' :
                embedStyle.googleFont === 'nunito' ? '"Nunito", sans-serif' :
                embedStyle.googleFont === 'source-sans' ? '"Source Sans Pro", sans-serif' :
                '"Inter", sans-serif'
            }}
          >
            {/* Header */}
            {embedStyle.showChatHeader && (
              <div 
                className="p-3 text-white flex items-center justify-between executa-chat-header"
                style={{ 
                  background: embedStyle.chatHeaderGradient || `linear-gradient(90deg, ${embedStyle.bubbleColor} 0%, ${embedStyle.userMessageBubbleColor} 100%)`,
                  borderRadius: `${embedStyle.borderRadius}px ${embedStyle.borderRadius}px 0 0`
                }}
              >
                <h3 className="text-sm font-medium">{embedStyle.chatHeaderTitle}</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto executa-chat-messages" style={{ height: '300px' }}>
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'items-start space-x-2'}`}>
                  {message.type === 'assistant' && embedStyle.showAssistantAvatar && (
                    <div 
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center executa-avatar"
                      style={{ backgroundColor: embedStyle.bubbleColor }}
                    >
                      <FontAwesomeIcon 
                        icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                        className="w-3 h-3 text-white"
                      />
                    </div>
                  )}
                  <div 
                    className={`max-w-[80%] px-2 py-1 text-xs ${
                      message.type === 'user' ? 'text-white executa-message-user' : 'text-gray-800 executa-message-assistant'
                    }`}
                    style={{ 
                      backgroundColor: message.type === 'user' 
                        ? embedStyle.userMessageBubbleColor 
                        : embedStyle.assistantMessageBubbleColor,
                      borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 executa-chat-input">
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={sendMessage}
                  className="p-1 rounded-lg"
                  style={{ backgroundColor: embedStyle.userMessageBubbleColor }}
                >
                  <Send className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Load embed styles when assistant changes
  useEffect(() => {
    if (assistant) {
      // Get advanced settings from handoffSettings if they exist
      const advancedSettings = assistant.handoffSettings?.embedAdvanced || {};
      
      setEmbedStyle({
        bubbleColor: assistant.embedBubbleColor || "#3B82F6",
        buttonShape: assistant.embedButtonShape || "rounded",
        fontStyle: assistant.embedFontStyle || "system",
        position: assistant.embedPosition || "bottom-right",
        chatBackgroundColor: assistant.chatBackgroundColor || "#FFFFFF",
        userMessageBubbleColor: assistant.userMessageBubbleColor || "#3B82F6",
        assistantMessageBubbleColor: assistant.assistantMessageBubbleColor || "#F3F4F6",
        assistantFontStyle: assistant.assistantFontStyle || "sans",
        messageBubbleRadius: assistant.messageBubbleRadius || 12,
        showAssistantAvatar: assistant.showAssistantAvatar !== false,
        assistantAvatarIcon: assistant.assistantAvatarUrl || "robot",
        showChatHeader: assistant.showChatHeader !== false,
        chatHeaderTitle: assistant.chatHeaderTitle || "AI Assistant",
        welcomeMessage: assistant.welcomeMessage || "",
        // Advanced styling options from stored settings
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
    }
  }, [assistant?.id]); // Only depend on assistant ID to avoid infinite loops

  // Load Google Fonts dynamically
  useEffect(() => {
    if (embedStyle.googleFont && embedStyle.googleFont !== 'inter') {
      const fontData = googleFonts.find(font => font.id === embedStyle.googleFont);
      if (fontData) {
        // Check if font is already loaded
        const existingLink = document.getElementById(`google-font-${embedStyle.googleFont}`);
        if (!existingLink) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = fontData.url;
          link.id = `google-font-${embedStyle.googleFont}`;
          document.head.appendChild(link);
        }
      }
    }
  }, [embedStyle.googleFont]);

  // Handle escape key for fullscreen modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenPreview) {
        setIsFullscreenPreview(false);
      }
    };

    if (isFullscreenPreview) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isFullscreenPreview]);

  const saveEmbedStyles = async () => {
    setIsSavingStyles(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`/api/models/${assistant?.id}/embed-styles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(embedStyle),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save embed styles');
      }

      toast.success("Embed styles saved successfully!");
    } catch (error) {
      console.error("Error saving embed styles:", error);
      toast.error("Failed to save embed styles");
    } finally {
      setIsSavingStyles(false);
    }
  };

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
      // Advanced styling options
      selectedTheme: 'custom',
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
    toast.success("Reset to default styling");
  };

  const generateStyledEmbedCode = () => {
    return `<!-- Executa AI Assistant Widget -->
<div id="executa-chat-widget"></div>
<script src="https://cdn.executa.ai/widget.js"></script>
<link rel="stylesheet" href="https://cdn.executa.ai/widget.css" />
<script>
  ExecutaChat.init({
    assistantId: '${assistant?.id}',
    containerId: 'executa-chat-widget',
    styles: {
      bubbleColor: '${embedStyle.bubbleColor}',
      buttonShape: '${embedStyle.buttonShape}',
      position: '${embedStyle.position}',
      chatBackgroundColor: '${embedStyle.chatBackgroundColor}',
      userMessageBubbleColor: '${embedStyle.userMessageBubbleColor}',
      assistantMessageBubbleColor: '${embedStyle.assistantMessageBubbleColor}',
      fontStyle: '${embedStyle.assistantFontStyle}',
      messageBubbleRadius: ${embedStyle.messageBubbleRadius},
      showAssistantAvatar: ${embedStyle.showAssistantAvatar},
      assistantAvatarIcon: '${embedStyle.assistantAvatarIcon}',
      showChatHeader: ${embedStyle.showChatHeader},
      chatHeaderTitle: '${embedStyle.chatHeaderTitle.replace(/'/g, "\'")}',
      welcomeMessage: '${(embedStyle.welcomeMessage || assistant?.welcomeMessage || '').replace(/'/g, "\\'")}'
    }
  });
</script>`;
  };

  const generateRawEmbedCode = () => {
    return `<!-- Executa AI Assistant Widget (Raw) -->
<div id="executa-chat" data-assistant-id="${assistant?.id}"></div>
<script src="https://cdn.executa.ai/widget.js"></script>
<script>
  ExecutaChat.init({
    assistantId: '${assistant?.id}',
    containerId: 'executa-chat'
  });
</script>`;
  };

  const copyEmbedCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Embed code copied to clipboard!");
    } catch (error) {
      console.error("Error copying embed code:", error);
      toast.error("Failed to copy embed code");
    }
  };

  const downloadWordPressPlugin = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      toast.success("Generating WordPress plugin...");

      const response = await fetch(`/api/models/${assistant?.id}/wordpress-plugin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate WordPress plugin');
      }

      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `executa-ai-${assistant?.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("WordPress plugin downloaded successfully!");
    } catch (error) {
      console.error("Error downloading WordPress plugin:", error);
      toast.error("Failed to download WordPress plugin");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Styling Controls - Full Width */}
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Advanced Widget Styling</span>
            </CardTitle>
            <CardDescription>
              Customize your chat widget with themes, advanced styling, and custom CSS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Style Tabs */}
            <Tabs value={activeStyleTab} onValueChange={(value) => setActiveStyleTab(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center space-x-1">
                  <Palette className="h-3 w-3" />
                  <span className="hidden sm:inline">Basic</span>
                </TabsTrigger>
                <TabsTrigger value="themes" className="flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden sm:inline">Themes</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center space-x-1">
                  <Wand2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Advanced</span>
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center space-x-1">
                  <Code className="h-3 w-3" />
                  <span className="hidden sm:inline">Custom</span>
                </TabsTrigger>
              </TabsList>

              {/* Basic Styling Tab */}
              <TabsContent value="basic" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Widget Button</h4>
              
              {/* Chat Bubble Color */}
              <div className="space-y-2">
                <Label>Chat Bubble Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={embedStyle.bubbleColor}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, bubbleColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={embedStyle.bubbleColor}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, bubbleColor: e.target.value }))}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              
              {/* Button Shape */}
              <div className="space-y-2">
                <Label>Button Shape</Label>
                <select
                  value={embedStyle.buttonShape}
                  onChange={(e) => setEmbedStyle(prev => ({ ...prev, buttonShape: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                </select>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label>Position</Label>
                <select
                  value={embedStyle.position}
                  onChange={(e) => setEmbedStyle(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>

            {/* Chat Interface Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Chat Interface</h4>

              {/* Chat Background Color */}
              <div className="space-y-2">
                <Label>Chat Background Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={embedStyle.chatBackgroundColor}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatBackgroundColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={embedStyle.chatBackgroundColor}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatBackgroundColor: e.target.value }))}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* User Message Bubble Color */}
              <div className="space-y-2">
                <Label>User Message Bubble Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={embedStyle.userMessageBubbleColor}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, userMessageBubbleColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={embedStyle.userMessageBubbleColor}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, userMessageBubbleColor: e.target.value }))}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Assistant Message Bubble Color */}
              <div className="space-y-2">
                <Label>Assistant Message Bubble Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={embedStyle.assistantMessageBubbleColor}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantMessageBubbleColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={embedStyle.assistantMessageBubbleColor}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantMessageBubbleColor: e.target.value }))}
                    placeholder="#F3F4F6"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Font Style */}
              <div className="space-y-2">
                <Label>Font Style</Label>
                <select
                  value={embedStyle.assistantFontStyle}
                  onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantFontStyle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sans">Sans Serif (Inter)</option>
                  <option value="serif">Serif (Georgia)</option>
                  <option value="mono">Monospace (JetBrains Mono)</option>
                </select>
              </div>

              {/* Message Bubble Radius */}
              <div className="space-y-2">
                <Label>Message Bubble Radius</Label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="1" 
                    value={embedStyle.messageBubbleRadius}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, messageBubbleRadius: parseInt(e.target.value) }))}
                    className="flex-1" 
                  />
                  <span className="text-sm text-gray-500 w-12">{embedStyle.messageBubbleRadius}px</span>
                </div>
              </div>

              {/* Show Assistant Avatar Toggle */}
              <div className="flex items-center justify-between">
                <Label>Show Assistant Avatar</Label>
                <button
                  onClick={() => setEmbedStyle(prev => ({ ...prev, showAssistantAvatar: !prev.showAssistantAvatar }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    embedStyle.showAssistantAvatar ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      embedStyle.showAssistantAvatar ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Assistant Avatar Icon */}
              {embedStyle.showAssistantAvatar && (
                <div className="space-y-2">
                  <Label>Assistant Avatar Icon</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <div className="flex items-center space-x-2">
                          <FontAwesomeIcon 
                            icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                            className="w-4 h-4"
                          />
                          <span>Choose Icon</span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 bg-white p-3">
                      <div className="grid grid-cols-4 gap-2">
                        {avatarIcons.map((iconOption) => (
                          <button
                            key={iconOption.id}
                            onClick={() => setEmbedStyle(prev => ({ ...prev, assistantAvatarIcon: iconOption.id }))}
                            className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all hover:bg-gray-50 ${
                              embedStyle.assistantAvatarIcon === iconOption.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200'
                            }`}
                          >
                            <FontAwesomeIcon 
                              icon={iconOption.icon}
                              className="w-5 h-5 text-gray-600"
                            />
                          </button>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Icon Preview */}
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: embedStyle.bubbleColor }}
                    >
                      <FontAwesomeIcon 
                        icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                        className="w-4 h-4"
                      />
                    </div>
                    <span className="text-sm text-gray-600">Preview of selected icon</span>
                  </div>
                </div>
              )}

              {/* Chat Header Toggle */}
              <div className="flex items-center justify-between">
                <Label>Enable Chat Header</Label>
                <button
                  onClick={() => setEmbedStyle(prev => ({ ...prev, showChatHeader: !prev.showChatHeader }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    embedStyle.showChatHeader ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      embedStyle.showChatHeader ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Header Title */}
              {embedStyle.showChatHeader && (
                <div className="space-y-2">
                  <Label>Header Title Text</Label>
                  <Input
                    value={embedStyle.chatHeaderTitle}
                    onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatHeaderTitle: e.target.value }))}
                    placeholder="AI Assistant"
                    className="w-full"
                  />
                </div>
              )}

              {/* Welcome Message */}
              <div className="space-y-2">
                <Label>Welcome Message Override</Label>
                <Textarea
                  value={embedStyle.welcomeMessage}
                  onChange={(e) => setEmbedStyle(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="Enter a custom welcome message (optional)"
                  className="w-full min-h-[80px]"
                />
              </div>
            </div>
              </TabsContent>

              {/* Themes Tab */}
              <TabsContent value="themes" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {/* Brand Color Extraction Feature */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">🎨 Auto-Extract Brand Colors</h4>
                        <p className="text-xs text-blue-700">
                          {user?.website ? 
                            `Automatically extract colors from ${user.website}` : 
                            'Add your website URL in settings to extract your brand colors'
                          }
                        </p>
                      </div>
                      <Button 
                        onClick={extractBrandColors}
                        disabled={!user?.website}
                        className="bg-blue-600 hover:bg-blue-700 text-white ml-3"
                        size="sm"
                      >
                        <Paintbrush className="h-4 w-4 mr-1" />
                        Extract Colors
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
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {/* Google Fonts */}
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Google Font</span>
                    </Label>
                    <Select 
                      value={embedStyle.googleFont} 
                      onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, googleFont: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {googleFonts.map(font => (
                          <SelectItem key={font.id} value={font.id}>{font.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Background Pattern */}
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Layers className="h-4 w-4" />
                      <span>Background Pattern</span>
                    </Label>
                    <Select 
                      value={embedStyle.backgroundPattern} 
                      onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, backgroundPattern: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {backgroundPatterns.map(pattern => (
                          <SelectItem key={pattern.id} value={pattern.id}>{pattern.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Chat Size */}
                  <div className="space-y-2">
                    <Label>Chat Window Size</Label>
                    <Select 
                      value={embedStyle.chatSize} 
                      onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, chatSize: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {chatSizes.map(size => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name} ({size.width} × {size.height})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Animation */}
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Animation Style</span>
                    </Label>
                    <Select 
                      value={embedStyle.animation} 
                      onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, animation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select animation" />
                      </SelectTrigger>
                      <SelectContent>
                        {animationOptions.map(anim => (
                          <SelectItem key={anim.id} value={anim.id}>{anim.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Glass Effect Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center space-x-2">
                      <span>Glass Morphism Effect</span>
                    </Label>
                    <Switch
                      checked={embedStyle.glassEffect}
                      onCheckedChange={(checked) => setEmbedStyle(prev => ({ ...prev, glassEffect: checked }))}
                    />
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-2">
                    <Label>Chat Window Opacity</Label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="range" 
                        min="50" 
                        max="100" 
                        step="5" 
                        value={embedStyle.opacity}
                        onChange={(e) => setEmbedStyle(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                        className="flex-1" 
                      />
                      <span className="text-sm text-gray-500 w-12">{embedStyle.opacity}%</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Custom CSS Tab */}
              <TabsContent value="custom" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center space-x-2">
                      <Code className="h-4 w-4" />
                      <span>Custom CSS Editor</span>
                    </Label>
                    <div className="text-xs text-gray-500">Smart IDE with auto-completion</div>
                  </div>
                  
                  {/* Monaco Editor */}
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      height="400px"
                      language="css"
                      theme="vs-light"
                      value={embedStyle.customCSS}
                      onChange={(value) => setEmbedStyle(prev => ({ ...prev, customCSS: value || '' }))}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        automaticLayout: true,
                        wordWrap: 'on',
                        tabSize: 2,
                        insertSpaces: true,
                        scrollBeyondLastLine: false,
                        renderLineHighlight: 'line',
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        readOnly: false,
                        cursorStyle: 'line',

                        formatOnPaste: true,
                        formatOnType: true,
                        autoIndent: 'full',
                        colorDecorators: true,
                        links: false,
                        contextmenu: true,
                        mouseWheelZoom: true
                      }}
                      onMount={(editor, monaco) => {
                        // Add custom CSS completions for chat widget
                        monaco.languages.registerCompletionItemProvider('css', {
                          provideCompletionItems: (model, position) => {
                            const word = model.getWordUntilPosition(position);
                            const range = {
                              startLineNumber: position.lineNumber,
                              endLineNumber: position.lineNumber,
                              startColumn: word.startColumn,
                              endColumn: word.endColumn
                            };
                            
                            const suggestions = [
                              {
                                label: '.executa-chat-widget',
                                kind: monaco.languages.CompletionItemKind.Class,
                                insertText: '.executa-chat-widget {\n\t\n}',
                                range: range,
                                documentation: 'Main chat widget container'
                              },
                              {
                                label: '.executa-chat-bubble',
                                kind: monaco.languages.CompletionItemKind.Class,
                                insertText: '.executa-chat-bubble {\n\t\n}',
                                range: range,
                                documentation: 'Chat bubble button'
                              },
                              {
                                label: '.executa-chat-header',
                                kind: monaco.languages.CompletionItemKind.Class,
                                insertText: '.executa-chat-header {\n\t\n}',
                                range: range,
                                documentation: 'Chat window header'
                              },
                              {
                                label: '.executa-chat-messages',
                                kind: monaco.languages.CompletionItemKind.Class,
                                insertText: '.executa-chat-messages {\n\t\n}',
                                range: range,
                                documentation: 'Messages container'
                              },
                              {
                                label: '.executa-message-user',
                                kind: monaco.languages.CompletionItemKind.Class,
                                insertText: '.executa-message-user {\n\t\n}',
                                range: range,
                                documentation: 'User message bubble'
                              },
                              {
                                label: '.executa-message-assistant',
                                kind: monaco.languages.CompletionItemKind.Class,
                                insertText: '.executa-message-assistant {\n\t\n}',
                                range: range,
                                documentation: 'Assistant message bubble'
                              },
                              {
                                label: '.executa-chat-input',
                                kind: monaco.languages.CompletionItemKind.Class,
                                insertText: '.executa-chat-input {\n\t\n}',
                                range: range,
                                documentation: 'Chat input area'
                              },
                              {
                                label: '.executa-avatar',
                                kind: monaco.languages.CompletionItemKind.Class,
                                insertText: '.executa-avatar {\n\t\n}',
                                range: range,
                                documentation: 'Assistant avatar'
                              }
                            ];
                            return { suggestions };
                          }
                        });
                        
                        // Set initial content if empty
                        if (!embedStyle.customCSS) {
                          editor.setValue(`/* Custom CSS for your chat widget */
/* Target specific elements with these classes: */

.executa-chat-widget {
  /* Main widget container */
  /* Example: box-shadow: 0 10px 30px rgba(0,0,0,0.3); */
}

.executa-chat-bubble {
  /* Chat bubble button */
  /* Example: transform: scale(1.1); */
}

.executa-chat-header {
  /* Chat window header */
  /* Example: background: linear-gradient(45deg, #ff6b6b, #4ecdc4); */
}

.executa-message-user {
  /* User message bubbles */
  /* Example: background: #667eea; */
}

.executa-message-assistant {
  /* Assistant message bubbles */
  /* Example: background: #f093fb; */
}

.executa-chat-input {
  /* Input area styling */
  /* Example: border: 2px solid #667eea; */
}

/* Advanced animations */
.executa-chat-widget:hover {
  /* Hover effects */
}

/* Media queries for responsive design */
@media (max-width: 768px) {
  .executa-chat-widget {
    /* Mobile-specific styles */
  }
}`);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">🎯 Available CSS Classes</h4>
                      <div className="text-xs text-blue-800 space-y-1">
                        <div><code className="bg-blue-100 px-1 rounded">.executa-chat-widget</code> - Main container</div>
                        <div><code className="bg-blue-100 px-1 rounded">.executa-chat-bubble</code> - Chat button</div>
                        <div><code className="bg-blue-100 px-1 rounded">.executa-chat-header</code> - Window header</div>
                        <div><code className="bg-blue-100 px-1 rounded">.executa-message-user</code> - User messages</div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <h4 className="text-sm font-medium text-green-900 mb-2">💡 Pro Tips</h4>
                      <div className="text-xs text-green-800 space-y-1">
                        <div>• Use Ctrl+Space for auto-completion</div>
                        <div>• CSS changes apply in real-time</div>
                        <div>• Supports animations & transitions</div>
                        <div>• Mobile-responsive with media queries</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex space-x-3 mt-6">
              <Button onClick={saveEmbedStyles} disabled={isSavingStyles} className="flex-1">
                {isSavingStyles ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Style Settings'
                )}
              </Button>
              <Button onClick={resetToDefaults} variant="outline" className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Sections - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Live Preview</span>
            </CardTitle>
            <CardDescription>
              See how your AI assistant will appear to visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Custom CSS injection for live previews */}
            {embedStyle.customCSS && (
              <style dangerouslySetInnerHTML={{
                __html: embedStyle.customCSS
              }} />
            )}
            
            {/* Preview Tabs */}
            <Tabs defaultValue="mock" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mock">Mock Website</TabsTrigger>
                <TabsTrigger value="live">Your Website</TabsTrigger>
              </TabsList>

              {/* Mock Website Preview */}
              <TabsContent value="mock" className="space-y-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Interactive Mock Website:</div>
                <div className="relative w-full bg-white border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  {/* Mock website content - more realistic */}
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                      <h1 className="text-lg font-bold">Your Company</h1>
                      <nav className="hidden md:flex space-x-4 text-sm">
                        <span>Home</span>
                        <span>About</span>
                        <span>Services</span>
                        <span>Contact</span>
                      </nav>
                    </div>
                    
                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Your Website</h2>
                      <p className="text-gray-600 text-sm mb-4">Experience how your AI assistant will interact with visitors</p>
                      <div className="bg-blue-500 text-white px-4 py-2 rounded text-sm inline-block">Get Started</div>
                    </div>
                    
                    {/* Content Area */}
                    <div className="flex-1 p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-100 h-16 rounded flex items-center justify-center text-xs text-gray-500">Service 1</div>
                        <div className="bg-gray-100 h-16 rounded flex items-center justify-center text-xs text-gray-500">Service 2</div>
                        <div className="bg-gray-100 h-16 rounded flex items-center justify-center text-xs text-gray-500">Service 3</div>
                      </div>
                      
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-gray-800 text-white p-4 text-center text-xs">
                      © 2024 Your Company. All rights reserved.
                    </div>
                  </div>
                  
                  {/* Functional chat widget overlay - properly positioned */}
                  <div 
                    className={`absolute z-20`}
                      style={{
                      bottom: '16px',
                      [embedStyle.position === 'bottom-left' ? 'left' : 'right']: '16px',
                      transform: 'scale(0.45)',
                      transformOrigin: embedStyle.position === 'bottom-left' ? 'bottom left' : 'bottom right'
                    }}
                  >
                    <LivePreviewChatWidget 
                      embedStyle={embedStyle}
                      assistant={assistant}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Live Website Preview */}
              <TabsContent value="live" className="space-y-4">
                {user?.website ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">
                        Preview on: {user.website}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(user.website, '_blank')}
                        className="flex items-center space-x-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open</span>
                      </Button>
                    </div>
                    
                    <div className="relative w-full border rounded-lg overflow-hidden bg-white" style={{ height: '400px' }}>
                      {/* Website iframe with proper scaling */}
                      <div className="relative w-full h-full overflow-hidden">
                      <iframe
                          src={getWebsiteUrl(user.website)}
                          className="absolute top-0 left-0 border-0"
                        style={{ 
                            width: '1000px',
                            height: '667px',
                          transform: 'scale(0.4)', 
                            transformOrigin: 'top left'
                        }}
                        title="Website Preview"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLIFrameElement;
                            target.style.display = 'none';
                            const errorDiv = target.parentElement?.nextElementSibling as HTMLElement;
                            if (errorDiv) errorDiv.style.display = 'block';
                          }}
                        />
                      </div>
                      
                      {/* Error fallback */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-gray-50 text-center p-6"
                        style={{ display: 'none' }}
                      >
                        <div>
                          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Cannot Load Website Preview</h3>
                          <p className="text-xs text-gray-500 mb-3">
                            This website cannot be displayed in a preview frame due to security restrictions.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(getWebsiteUrl(user.website), '_blank')}
                            className="flex items-center space-x-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Open Website</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Functional chat widget overlay - properly positioned */}
                      <div 
                        className={`absolute z-20`}
                          style={{
                          bottom: '16px',
                          [embedStyle.position === 'bottom-left' ? 'left' : 'right']: '16px',
                          transform: 'scale(0.4)',
                          transformOrigin: embedStyle.position === 'bottom-left' ? 'bottom left' : 'bottom right'
                        }}
                      >
                        <LivePreviewChatWidget 
                          embedStyle={embedStyle}
                          assistant={assistant}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Website URL Found</h3>
                    <p className="text-gray-600 mb-4">Add your website URL in settings to see the live preview</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open('/dashboard/settings', '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Go to Settings</span>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Chat Interface Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
            <CardTitle>Chat Interface Preview</CardTitle>
            <CardDescription>
              How the chat window will look when opened
            </CardDescription>
                </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreenPreview(true)}
                className="flex items-center space-x-1"
              >
                <Maximize className="h-4 w-4" />
                <span>Fullscreen</span>
              </Button>
                      </div>
          </CardHeader>
          <CardContent>
            {/* Add custom CSS if provided */}
            {embedStyle.customCSS && (
              <style dangerouslySetInnerHTML={{
                __html: embedStyle.customCSS
              }} />
            )}
            
            <ChatPreviewComponent embedStyle={embedStyle} />
          </CardContent>
        </Card>
      </div>

      {/* Embed Code Generator Section - Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5" />
                <span>Embed Generator</span>
              </CardTitle>
              <CardDescription>
                Copy and paste this code into your website to add the styled chat widget
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={resetToDefaults} variant="outline" size="sm" className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Reset to Default Style</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code Type Tabs */}
          <Tabs value={embedCodeType} onValueChange={(value) => setEmbedCodeType(value as 'styled' | 'raw' | 'wordpress')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="styled">Styled Embed</TabsTrigger>
              <TabsTrigger value="raw">Raw Embed</TabsTrigger>
              <TabsTrigger value="wordpress">WordPress Plugin</TabsTrigger>
            </TabsList>

            {/* Styled Embed Content */}
            <TabsContent value="styled" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Working styled embed snippet that includes all UI settings
                  </p>
                  <Button
                    onClick={() => copyEmbedCode(generateStyledEmbedCode())}
                    className="flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Code</span>
                  </Button>
                </div>
                <ScrollArea className="h-64 w-full border rounded-md">
                  <pre className="p-4 text-xs overflow-x-auto">
                    <code>{generateStyledEmbedCode()}</code>
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Raw Embed Content */}
            <TabsContent value="raw" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Minimal version without styles for full customization
                  </p>
                  <Button
                    onClick={() => copyEmbedCode(generateRawEmbedCode())}
                    className="flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Code</span>
                  </Button>
                </div>
                <ScrollArea className="h-32 w-full border rounded-md">
                  <pre className="p-4 text-xs overflow-x-auto">
                    <code>{generateRawEmbedCode()}</code>
                  </pre>
                </ScrollArea>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This embed includes no styling. You can target <code className="bg-blue-100 px-1 rounded">.executa-chat</code> via your own stylesheet for full customization.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* WordPress Plugin Content */}
            <TabsContent value="wordpress" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.469 0.298c-0.328-0.298-0.844-0.298-1.172 0l-1.797 1.625c-0.328 0.297-0.328 0.781 0 1.078l2.5 2.266c0.164 0.148 0.375 0.223 0.586 0.223s0.422-0.074 0.586-0.223c0.328-0.297 0.328-0.781 0-1.078l-0.414-0.375 0.711-0.641c0.328-0.297 0.328-0.781 0-1.078zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75-4.365-9.75-9.75-9.75zM12 19.5c-4.273 0-7.75-3.477-7.75-7.75s3.477-7.75 7.75-7.75 7.75 3.477 7.75 7.75-3.477 7.75-7.75 7.75z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-blue-900 mb-2">WordPress Plugin Ready</h3>
                      <p className="text-sm text-blue-800 mb-3">
                        Download a custom WordPress plugin that includes your styled chat widget. 
                        No coding required – just install and activate.
                      </p>
                      <Button 
                        onClick={downloadWordPressPlugin}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download WordPress Plugin
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="text-xs text-amber-800">
                      <p className="font-medium mb-1">Installation Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Download the plugin ZIP file</li>
                        <li>Go to your WordPress admin → Plugins → Add New → Upload Plugin</li>
                        <li>Upload the ZIP file and activate the plugin</li>
                        <li>Visit Settings → {assistant?.name} AI to configure display options</li>
                        <li>The chat widget will appear on your site automatically</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> The plugin connects to your Executa.ai assistant. To modify AI responses, training, or view analytics, 
                    use your <a href={`https://app.executa.ai/dashboard/assistants/${assistant?.id}`} target="_blank" rel="noopener noreferrer" className="underline">Executa.ai dashboard</a>.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Fullscreen Preview Modal */}
      {isFullscreenPreview && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullscreenPreview(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-full max-h-full overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Chat Interface Preview</h2>
                <p className="text-sm text-gray-600">Fullscreen view of your chat widget</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreenPreview(false)}
                className="flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Close</span>
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 flex items-center justify-center min-h-[70vh]">
              {/* Apply custom CSS for fullscreen too */}
              {embedStyle.customCSS && (
                <style dangerouslySetInnerHTML={{
                  __html: embedStyle.customCSS
                }} />
              )}
              
              <ChatPreviewComponent embedStyle={embedStyle} isFullscreen={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 