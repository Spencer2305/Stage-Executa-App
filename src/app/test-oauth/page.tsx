"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestOAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [config, setConfig] = useState<any>(null);
  const searchParams = useSearchParams();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    // Check for OAuth callback parameters
    const token = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    const error = searchParams.get('error');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (token) {
      addLog(`✅ OAuth Success! Token received: ${token.substring(0, 20)}...`);
      addLog(`OAuth Provider: ${oauth}`);
    }

    if (error) {
      addLog(`❌ OAuth Error: ${error}`);
    }

    if (code) {
      addLog(`📋 Authorization code received: ${code.substring(0, 20)}...`);
    }

    if (state) {
      addLog(`🔐 State parameter: ${state}`);
    }

    // Load OAuth configuration
    fetch('/api/debug/oauth-config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        addLog('📡 OAuth configuration loaded');
      })
      .catch(err => {
        addLog(`❌ Failed to load config: ${err.message}`);
      });
  }, [searchParams]);

  const testOAuthURL = async (provider: 'google' | 'facebook') => {
    try {
      addLog(`🔍 Testing ${provider} OAuth URL generation...`);
      
      const response = await fetch(`/api/debug/oauth-test?provider=${provider}`);
      const data = await response.json();
      
      addLog(`🔗 ${provider} OAuth URL: ${data.authUrl}`);
      addLog(`📍 Redirect URI: ${data.redirectUri}`);
      addLog(`🔑 Client ID: ${data.clientId}`);
      
      return data.authUrl;
    } catch (error) {
      addLog(`❌ Error testing ${provider}: ${error}`);
      return null;
    }
  };

  const startOAuth = async (provider: 'google' | 'facebook') => {
    const url = await testOAuthURL(provider);
    if (url) {
      addLog(`🚀 Redirecting to ${provider} OAuth...`);
      window.location.href = url;
    }
  };

  const manualTest = (provider: 'google' | 'facebook') => {
    addLog(`🔧 Starting manual ${provider} OAuth test...`);
    const redirectTo = '/test-oauth';
    window.location.href = `/api/auth/oauth/${provider}?redirectTo=${encodeURIComponent(redirectTo)}`;
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">OAuth Debug Dashboard</h1>
        
        {/* Configuration Display */}
        <Card>
          <CardHeader>
            <CardTitle>OAuth Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {config ? (
              <div className="space-y-2 font-mono text-sm">
                <div>NEXTAUTH_URL: {config.NEXTAUTH_URL}</div>
                <div>Facebook Client ID: {config.FACEBOOK_CLIENT_ID}</div>
                <div>Google Redirect: {config.google_redirect_uri}</div>
                <div>Facebook Redirect: {config.facebook_redirect_uri}</div>
              </div>
            ) : (
              <div>Loading configuration...</div>
            )}
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>OAuth Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={() => testOAuthURL('google')}>
                Test Google URL
              </Button>
              <Button onClick={() => testOAuthURL('facebook')}>
                Test Facebook URL
              </Button>
            </div>
            
            <div className="flex gap-4">
              <Button onClick={() => startOAuth('google')} variant="outline">
                🔗 Generated Google OAuth
              </Button>
              <Button onClick={() => startOAuth('facebook')} variant="outline">
                🔗 Generated Facebook OAuth
              </Button>
            </div>
            
            <div className="flex gap-4">
              <Button onClick={() => manualTest('google')} variant="secondary">
                🚀 Manual Google OAuth
              </Button>
              <Button onClick={() => manualTest('facebook')} variant="secondary">
                🚀 Manual Facebook OAuth
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Callback Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Google Callback:</strong> <code>/api/auth/oauth/google/callback</code></p>
              <p><strong>Facebook Callback:</strong> <code>/api/auth/oauth/facebook/callback</code></p>
              <p className="mt-4">If OAuth providers are redirecting but callbacks aren't working, try accessing these URLs directly with test parameters.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 