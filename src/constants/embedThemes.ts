// Theme Presets
export const themePresets = {
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