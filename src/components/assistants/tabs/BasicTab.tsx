'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { avatarIcons } from '@/constants/embedConstants';

interface BasicTabProps {
  embedStyle: any;
  setEmbedStyle: (setter: (prev: any) => any) => void;
}

export default function BasicTab({ embedStyle, setEmbedStyle }: BasicTabProps) {
  return (
    <div className="space-y-6 mt-6">
      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bubbleColor" className="text-xs">Chat Button Color</Label>
            <Input
              id="bubbleColor"
              type="color"
              value={embedStyle.bubbleColor}
              onChange={(e) => setEmbedStyle(prev => ({ ...prev, bubbleColor: e.target.value }))}
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="chatBackgroundColor" className="text-xs">Chat Background</Label>
            <Input
              id="chatBackgroundColor"
              type="color"
              value={embedStyle.chatBackgroundColor}
              onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatBackgroundColor: e.target.value }))}
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="userMessageBubbleColor" className="text-xs">User Messages</Label>
            <Input
              id="userMessageBubbleColor"
              type="color"
              value={embedStyle.userMessageBubbleColor}
              onChange={(e) => setEmbedStyle(prev => ({ ...prev, userMessageBubbleColor: e.target.value }))}
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="assistantMessageBubbleColor" className="text-xs">Assistant Messages</Label>
            <Input
              id="assistantMessageBubbleColor"
              type="color"
              value={embedStyle.assistantMessageBubbleColor}
              onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantMessageBubbleColor: e.target.value }))}
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* Position & Shape */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Position & Shape</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="position" className="text-xs">Position</Label>
            <Select value={embedStyle.position} onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, position: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="buttonShape" className="text-xs">Button Shape</Label>
            <Select value={embedStyle.buttonShape} onValueChange={(value) => setEmbedStyle(prev => ({ ...prev, buttonShape: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chat Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Chat Header</h4>
          <Switch
            checked={embedStyle.showChatHeader}
            onCheckedChange={(checked) => setEmbedStyle(prev => ({ ...prev, showChatHeader: checked }))}
          />
        </div>
        {embedStyle.showChatHeader && (
          <div>
            <Label htmlFor="chatHeaderTitle" className="text-xs">Header Title</Label>
            <Input
              id="chatHeaderTitle"
              value={embedStyle.chatHeaderTitle}
              onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatHeaderTitle: e.target.value }))}
              placeholder="AI Assistant"
            />
          </div>
        )}
      </div>

      {/* Assistant Avatar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Assistant Avatar</h4>
          <Switch
            checked={embedStyle.showAssistantAvatar}
            onCheckedChange={(checked) => setEmbedStyle(prev => ({ ...prev, showAssistantAvatar: checked }))}
          />
        </div>
        {embedStyle.showAssistantAvatar && (
          <div>
            <Label className="text-xs">Avatar Icon</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {avatarIcons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => setEmbedStyle(prev => ({ ...prev, assistantAvatarIcon: icon.id }))}
                  className={`p-2 border rounded-lg hover:border-blue-300 transition-colors ${
                    embedStyle.assistantAvatarIcon === icon.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  title={icon.label}
                >
                  <FontAwesomeIcon icon={icon.icon} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Welcome Message */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Welcome Message</h4>
        <div>
          <Label htmlFor="welcomeMessage" className="text-xs">Message Text</Label>
          <Textarea
            id="welcomeMessage"
            value={embedStyle.welcomeMessage}
            onChange={(e) => setEmbedStyle(prev => ({ ...prev, welcomeMessage: e.target.value }))}
            placeholder="Hello! How can I help you today?"
            className="min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
} 