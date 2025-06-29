"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PortalPage() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const response = await fetch('/api/portal/auth/me');
      if (response.ok) {
        router.push('/portal/dashboard');
      } else {
        router.push('/portal/login');
      }
    } catch (error) {
      router.push('/portal/login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading portal...</p>
      </div>
    </div>
  );
} 