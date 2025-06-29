"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  LogOut, 
  User, 
  Grid3X3, 
  ExternalLink, 
  Plus,
  Settings,
  Loader2
} from 'lucide-react';

interface App {
  id: string;
  name: string;
  description: string;
  url: string;
  previewUrl: string;
  icon?: string;
  status: 'active' | 'coming-soon' | 'maintenance';
  category: string;
}

interface PortalUser {
  id: string;
  username: string;
  role: string;
  lastLogin?: string;
}

export default function PortalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<PortalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Apps configuration
  const apps: App[] = [
    {
      id: 'executa',
      name: 'Executa',
      description: 'AI Assistant Builder Platform',
      url: 'https://executa.app',
      previewUrl: 'https://executa.app',
      status: 'active',
      category: 'AI Tools'
    },
    {
      id: 'app2',
      name: 'Coming Soon',
      description: 'Next Application',
      url: '#',
      previewUrl: '',
      status: 'coming-soon',
      category: 'Productivity'
    },
    {
      id: 'app3',
      name: 'Coming Soon',
      description: 'Another Application',
      url: '#',
      previewUrl: '',
      status: 'coming-soon',
      category: 'Analytics'
    },
    {
      id: 'app4',
      name: 'Coming Soon',
      description: 'Future Tool',
      url: '#',
      previewUrl: '',
      status: 'coming-soon',
      category: 'Communication'
    }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/portal/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/portal/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/portal/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/portal/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAppClick = (app: App) => {
    if (app.status === 'coming-soon') {
      toast.info(`${app.name} is coming soon!`);
      return;
    }
    
    if (app.url === '#') {
      return;
    }

    // Open in new tab
    window.open(app.url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Grid3X3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Company Portal</h1>
                <p className="text-sm text-muted-foreground">Application Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span>Welcome, {user?.username}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Applications</h2>
          <p className="text-muted-foreground">
            Click on any application to access it. Active applications will open in a new tab.
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {apps.map((app) => (
            <Card 
              key={app.id}
              className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                app.status === 'coming-soon' ? 'opacity-60' : ''
              }`}
              onClick={() => handleAppClick(app)}
            >
              <CardContent className="p-0">
                {/* App Preview */}
                <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  {app.status === 'active' && app.previewUrl ? (
                    <>
                      {/* Iframe Preview */}
                      <iframe
                        src={app.previewUrl}
                        className="w-full h-full scale-50 origin-top-left"
                        style={{ 
                          width: '200%', 
                          height: '200%',
                          pointerEvents: 'none'
                        }}
                        title={`${app.name} Preview`}
                      />
                      
                      {/* White Overlay with App Name */}
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/95 transition-colors">
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {app.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {app.description}
                          </p>
                          <div className="mt-3 flex items-center justify-center">
                            <ExternalLink className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Coming Soon Placeholder */
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <Plus className="h-6 w-6 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">
                          {app.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {app.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* App Info Footer */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        app.status === 'active' ? 'bg-green-500' : 
                        app.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {app.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      {app.category}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Section (if admin user) */}
        {user?.role === 'admin' && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Admin Tools</h3>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Apps
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add new applications, manage user access, and configure portal settings.
            </p>
          </div>
        )}
      </main>
    </div>
  );
} 