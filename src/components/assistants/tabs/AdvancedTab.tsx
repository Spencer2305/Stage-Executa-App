'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
// Using range input instead of slider
import { googleFonts, backgroundPatterns, animationOptions, chatSizes } from '@/constants/embedConstants';

interface AdvancedTabProps {
  embedStyle: any;
  setEmbedStyle: (setter: (prev: any) => any) => void;
}

export default function AdvancedTab({ embedStyle, setEmbedStyle }: AdvancedTabProps) {
  return (
    <div className="space-y-6 mt-6">
      {/* Typography */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Typography</h4>
        <div>
          <Label htmlFor="googleFont" className="text-xs">Google Font</Label>
          <Select value={embedStyle.googleFont} onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, googleFont: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {googleFonts.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Layout & Size */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Layout & Size</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="chatSize" className="text-xs">Chat Window Size</Label>
            <Select value={embedStyle.chatSize} onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, chatSize: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chatSizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.name} ({size.width} x {size.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="borderRadius" className="text-xs">Border Radius: {embedStyle.borderRadius}px</Label>
            <Input
              type="range"
              value={embedStyle.borderRadius}
              onChange={(e) => setEmbedStyle(prev => ({ ...prev, borderRadius: parseInt(e.target.value) }))}
              max={25}
              min={0}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="opacity" className="text-xs">Opacity: {embedStyle.opacity}%</Label>
          <Input
            type="range"
            value={embedStyle.opacity}
            onChange={(e) => setEmbedStyle(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
            max={100}
            min={50}
            step={5}
            className="mt-2"
          />
        </div>
      </div>

      {/* Visual Effects */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Visual Effects</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="backgroundPattern" className="text-xs">Background Pattern</Label>
            <Select value={embedStyle.backgroundPattern} onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, backgroundPattern: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {backgroundPatterns.map((pattern) => (
                  <SelectItem key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="animation" className="text-xs">Animation Style</Label>
            <Select value={embedStyle.animation} onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, animation: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {animationOptions.map((anim) => (
                  <SelectItem key={anim.id} value={anim.id}>
                    {anim.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Glass Effect</Label>
            <p className="text-xs text-gray-500">Applies blur and transparency</p>
          </div>
          <Switch
            checked={embedStyle.glassEffect}
            onCheckedChange={(checked) => setEmbedStyle(prev => ({ ...prev, glassEffect: checked }))}
          />
        </div>
      </div>

      {/* Advanced Color Controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Advanced Colors</h4>
        <div>
          <Label htmlFor="chatHeaderGradient" className="text-xs">Header Gradient (CSS)</Label>
          <Input
            id="chatHeaderGradient"
            value={embedStyle.chatHeaderGradient}
            onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatHeaderGradient: e.target.value }))}
            placeholder="linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
            className="text-xs font-mono"
          />
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        💡 <strong>Advanced Tip:</strong> These settings provide fine-grained control over your chat widget's appearance. Changes are applied in real-time to the preview.
      </div>
    </div>
  );
} 