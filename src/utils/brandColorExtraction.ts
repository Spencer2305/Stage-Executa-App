// Brand color extraction utilities

export const extractColorsClientSide = async (url: string): Promise<string[]> => {
  try {
    // Try to get favicon first
    const faviconColors = await extractColorsFromImage(`${url}/favicon.ico`);
    if (faviconColors.length > 0) {
      return faviconColors;
    }

    // Try Apple touch icon
    const appleIconColors = await extractColorsFromImage(`${url}/apple-touch-icon.png`);
    if (appleIconColors.length > 0) {
      return appleIconColors;
    }

    // Try common logo paths
    const commonLogoPaths = [
      '/logo.png',
      '/logo.jpg',
      '/logo.svg',
      '/assets/logo.png',
      '/images/logo.png'
    ];

    for (const path of commonLogoPaths) {
      try {
        const colors = await extractColorsFromImage(`${url}${path}`);
        if (colors.length > 0) {
          return colors;
        }
      } catch (e) {
        // Continue to next path
      }
    }

    // Fallback to domain-based suggestions
    return await suggestColorsFromDomain(url);
  } catch (error) {
    console.error('Client-side color extraction failed:', error);
    return await suggestColorsFromDomain(url);
  }
};

export const extractColorsFromImage = (imageUrl: string): Promise<string[]> => {
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
        console.error('Image processing error:', error);
        resolve([]);
      }
    };

    img.onerror = () => {
      resolve([]);
    };

    // Add cache-busting parameter
    img.src = imageUrl + '?t=' + Date.now();
  });
};

export const extractDominantColors = (data: Uint8ClampedArray): string[] => {
  const colorMap = new Map();
  const sampleRate = 10; // Sample every 10th pixel for performance

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    // Skip very light/dark colors
    const brightness = (r + g + b) / 3;
    if (brightness > 240 || brightness < 15) continue;

    // Round colors to reduce noise
    const roundedR = Math.round(r / 30) * 30;
    const roundedG = Math.round(g / 30) * 30;
    const roundedB = Math.round(b / 30) * 30;

    const colorKey = `${roundedR},${roundedG},${roundedB}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
  }

  // Sort by frequency and take top colors
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number);
      return rgbToHex(r, g, b);
    });

  return sortedColors;
};

export const suggestColorsFromDomain = async (url: string): Promise<string[]> => {
  const domain = new URL(url).hostname.toLowerCase();
  
  // Industry-based color suggestions
  const industryColors: Record<string, string[]> = {
    // Tech companies
    'tech': ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
    'software': ['#6366F1', '#4F46E5', '#4338CA', '#3730A3'],
    
    // Finance
    'bank': ['#1F2937', '#374151', '#4B5563', '#1E40AF'],
    'finance': ['#059669', '#047857', '#065F46', '#064E3B'],
    'investment': ['#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'],
    
    // Healthcare
    'health': ['#0EA5E9', '#0284C7', '#0369A1', '#075985'],
    'medical': ['#10B981', '#059669', '#047857', '#065F46'],
    'hospital': ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'],
    
    // E-commerce
    'shop': ['#F59E0B', '#D97706', '#B45309', '#92400E'],
    'store': ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
    'marketplace': ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
    
    // Default
    'default': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
  };

  // Check domain for industry keywords
  for (const [industry, colors] of Object.entries(industryColors)) {
    if (domain.includes(industry)) {
      return colors;
    }
  }

  // Check for common patterns
  if (domain.includes('bank') || domain.includes('finance')) {
    return industryColors.finance;
  }
  if (domain.includes('health') || domain.includes('medical')) {
    return industryColors.health;
  }
  if (domain.includes('shop') || domain.includes('store') || domain.includes('buy')) {
    return industryColors.shop;
  }

  return industryColors.default;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const lightenColor = (color: string, factor: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const newR = Math.min(255, Math.round(r + (255 - r) * factor));
  const newG = Math.min(255, Math.round(g + (255 - g) * factor));
  const newB = Math.min(255, Math.round(b + (255 - b) * factor));
  
  return rgbToHex(newR, newG, newB);
};

export const getWebsiteUrl = (website: string): string => {
  if (!website) return 'https://example.com';
  
  let url = website.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}; 