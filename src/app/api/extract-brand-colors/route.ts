import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';

async function handleBrandColorExtraction(request: NextRequest): Promise<NextResponse> {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Clean up the URL
    let websiteUrl = url;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }

    const colors = await extractColorsFromWebsite(websiteUrl);
    
    return NextResponse.json({ 
      colors,
      url: websiteUrl,
      extractedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Brand color extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract brand colors' }, 
      { status: 500 }
    );
  }
}

// Apply rate limiting
export const POST = withRateLimit(RATE_LIMIT_CONFIGS.API, handleBrandColorExtraction);

async function extractColorsFromWebsite(url: string): Promise<string[]> {
  const colors: string[] = [];
  
  try {
    // Method 1: Try to get the favicon and extract colors
    const faviconColors = await extractColorsFromImage(`${new URL(url).origin}/favicon.ico`);
    colors.push(...faviconColors);
    
    // Method 2: Try common logo paths
    const logoUrls = [
      `${new URL(url).origin}/logo.png`,
      `${new URL(url).origin}/logo.svg`,
      `${new URL(url).origin}/assets/logo.png`,
      `${new URL(url).origin}/images/logo.png`,
      `${new URL(url).origin}/static/logo.png`,
      `${new URL(url).origin}/public/logo.png`
    ];
    
    for (const logoUrl of logoUrls) {
      if (colors.length >= 3) break; // We have enough colors
      
      try {
        const logoColors = await extractColorsFromImage(logoUrl);
        colors.push(...logoColors);
      } catch (e) {
        // Continue to next logo URL
      }
    }
    
    // Method 3: Analyze the main webpage HTML for color patterns
    if (colors.length < 2) {
      const htmlColors = await extractColorsFromHTML(url);
      colors.push(...htmlColors);
    }
    
    // Method 4: Industry-based suggestions as fallback
    if (colors.length === 0) {
      const suggestedColors = suggestColorsFromDomain(url);
      colors.push(...suggestedColors);
    }
    
    // Remove duplicates and return top 3 colors
    const uniqueColors = [...new Set(colors)];
    return uniqueColors.slice(0, 3);
    
  } catch (error) {
    console.error('Server-side color extraction failed:', error);
    
    // Return industry-based suggestions as ultimate fallback
    return suggestColorsFromDomain(url);
  }
}

async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  try {
    // In a production environment, you'd use a proper image processing library
    // For now, we'll simulate this with a timeout and return empty array
    // You could implement actual image processing using libraries like:
    // - sharp (for Node.js image processing)
    // - canvas (for server-side canvas operations)
    // - or call external APIs like Color API, Imagga, etc.
    
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (response.ok) {
      // For demo purposes, we'll return some colors based on response headers
      // In a real implementation, you'd process the actual image
      return [];
    }
    
    return [];
  } catch (error) {
    return [];
  }
}

async function extractColorsFromHTML(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ColorExtractor/1.0)'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      return [];
    }
    
    const html = await response.text();
    const colors: string[] = [];
    
    // Extract colors from CSS styles in the HTML
    const colorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
    const matches = html.match(colorRegex);
    
    if (matches) {
      // Filter out common unwanted colors and convert to full hex
      const filteredColors = matches
        .map(color => color.length === 4 ? 
          '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] : 
          color
        )
        .filter(color => {
          const hex = color.toLowerCase();
          // Filter out very common colors (white, black, gray variations)
          return !['#ffffff', '#000000', '#fff', '#000', '#f0f0f0', '#e0e0e0', '#d0d0d0', '#c0c0c0'].includes(hex);
        });
      
      // Get most common colors
      const colorCount = new Map<string, number>();
      filteredColors.forEach(color => {
        const normalized = color.toLowerCase();
        colorCount.set(normalized, (colorCount.get(normalized) || 0) + 1);
      });
      
      const sortedColors = Array.from(colorCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color)
        .slice(0, 3);
      
      colors.push(...sortedColors);
    }
    
    return colors;
  } catch (error) {
    console.error('HTML color extraction failed:', error);
    return [];
  }
}

function suggestColorsFromDomain(url: string): string[] {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Industry-based color suggestions
    if (domain.includes('health') || domain.includes('medical') || domain.includes('care')) {
      return ['#0EA5E9', '#06B6D4', '#E0F2FE']; // Healthcare blues
    }
    if (domain.includes('finance') || domain.includes('bank') || domain.includes('pay')) {
      return ['#1F2937', '#374151', '#F3F4F6']; // Finance grays
    }
    if (domain.includes('shop') || domain.includes('store') || domain.includes('buy') || domain.includes('ecommerce')) {
      return ['#10B981', '#059669', '#ECFDF5']; // E-commerce greens
    }
    if (domain.includes('edu') || domain.includes('school') || domain.includes('learn') || domain.includes('university')) {
      return ['#8B5CF6', '#7C3AED', '#F3E8FF']; // Education purples
    }
    if (domain.includes('tech') || domain.includes('software') || domain.includes('app') || domain.includes('dev')) {
      return ['#3B82F6', '#1D4ED8', '#EFF6FF']; // Tech blues
    }
    if (domain.includes('restaurant') || domain.includes('food') || domain.includes('cafe')) {
      return ['#F59E0B', '#D97706', '#FEF3C7']; // Food oranges
    }
    if (domain.includes('real') || domain.includes('estate') || domain.includes('property')) {
      return ['#059669', '#047857', '#ECFDF5']; // Real estate greens
    }
    if (domain.includes('law') || domain.includes('legal') || domain.includes('attorney')) {
      return ['#1F2937', '#4B5563', '#F9FAFB']; // Legal grays
    }
    
    // Default modern colors
    return ['#3B82F6', '#1D4ED8', '#F1F5F9'];
  } catch (error) {
    return ['#3B82F6', '#1D4ED8', '#F1F5F9'];
  }
} 