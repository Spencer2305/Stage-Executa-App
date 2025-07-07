"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPasswordResetPage() {
  const [email, setEmail] = useState("test@example.com");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("newpassword123");
  const [result, setResult] = useState<any>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("your-email@example.com");

  const testForgotPassword = async () => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResult(data);
      console.log('Forgot password result:', data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Network error' });
    }
  };

  const testVerifyToken = async () => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      setResult(data);
      console.log('Verify token result:', data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Network error' });
    }
  };

  const testResetPassword = async () => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      setResult(data);
      console.log('Reset password result:', data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Network error' });
    }
  };

  const testSendEmail = async () => {
    try {
      const response = await fetch('/api/test/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmailAddress }),
      });
      const data = await response.json();
      setResult(data);
      console.log('Test email result:', data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Network error' });
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return <div>This page is only available in development</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Password Reset Testing</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Test Forgot Password */}
          <Card>
            <CardHeader>
              <CardTitle>1. Forgot Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={testForgotPassword} className="w-full">
                Send Reset Email
              </Button>
            </CardContent>
          </Card>

          {/* Test Verify Token */}
          <Card>
            <CardHeader>
              <CardTitle>2. Verify Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Reset Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button onClick={testVerifyToken} className="w-full">
                Verify Token
              </Button>
            </CardContent>
          </Card>

          {/* Test Reset Password */}
          <Card>
            <CardHeader>
              <CardTitle>3. Reset Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={testResetPassword} className="w-full">
                Reset Password
              </Button>
            </CardContent>
          </Card>

          {/* Test AWS SES Email */}
          <Card>
            <CardHeader>
              <CardTitle>4. Test Email (AWS SES)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Your email address"
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
              <Button onClick={testSendEmail} className="w-full">
                Send Test Email
              </Button>
              <p className="text-xs text-gray-500">
                Tests AWS SES email sending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p><strong>1. Test Forgot Password:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Enter an email address of an existing user</li>
                <li>Click "Send Reset Email"</li>
                <li>Check the console for the reset URL (in dev mode)</li>
                <li>Copy the token from the URL</li>
              </ul>
              
              <p><strong>2. Test Verify Token:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Paste the token from step 1</li>
                <li>Click "Verify Token"</li>
                <li>Should return valid: true</li>
              </ul>
              
              <p><strong>3. Test Reset Password:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Enter a new password</li>
                <li>Click "Reset Password"</li>
                <li>Should return success message</li>
                <li>Try logging in with the new password</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 