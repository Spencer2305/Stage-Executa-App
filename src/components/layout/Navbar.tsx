"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/state/userStore";
import { 
  Menu, 
  X, 
  User,
  LogOut,
  Settings,
  CreditCard,
  Plus,
  Bot,
  BarChart3,
  Cog,
  LayoutDashboard
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useUserStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Check if we're on dashboard pages
  const isDashboard = pathname?.startsWith('/dashboard');

  // Helper function to get active state classes
  const getLinkClasses = (href: string) => {
    const isActive = pathname === href;
    return `text-sm font-medium transition-colors ${
      isActive 
        ? 'text-brand-600 border-b-2 border-brand-600 pb-1' 
        : 'text-muted-foreground hover:text-brand-600 hover:bg-transparent'
    }`;
  };

  // Helper function for mobile link classes
  const getMobileLinkClasses = (href: string) => {
    const isActive = pathname === href;
    return `block py-2 text-sm font-medium transition-colors ${
      isActive 
        ? 'text-brand-600 bg-brand-50 px-3 rounded-md' 
        : 'text-muted-foreground hover:text-brand-600 hover:bg-transparent'
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="relative h-12 w-[200px]">
            <Image
              src="/Executa-logo.png"
              alt="Executa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center space-x-6">
          {isDashboard ? (
            // Dashboard Navigation
            <>
              <Link 
                href="/dashboard" 
                className={getLinkClasses('/dashboard')}
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/create" 
                className={getLinkClasses('/dashboard/create')}
              >
                Create an AI
              </Link>
              <Link 
                href="/dashboard/my-ais" 
                className={getLinkClasses('/dashboard/my-ais')}
              >
                My AIs
              </Link>
              <Link 
                href="/dashboard/analytics" 
                className={getLinkClasses('/dashboard/analytics')}
              >
                Analytics
              </Link>
              <Link 
                href="/dashboard/settings" 
                className={getLinkClasses('/dashboard/settings')}
              >
                Settings
              </Link>
            </>
          ) : (
            // Marketing Navigation
            <>
              <Link 
                href="#features" 
                className="text-sm font-medium text-muted-foreground hover:text-brand-600 hover:bg-transparent transition-colors"
              >
                Features
              </Link>
              <Link 
                href="#pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-brand-600 hover:bg-transparent transition-colors"
              >
                Pricing
              </Link>
              <Link 
                href="/docs" 
                className="text-sm font-medium text-muted-foreground hover:text-brand-600 hover:bg-transparent transition-colors"
              >
                Docs
              </Link>
            </>
          )}
        </div>

        {/* Auth Buttons - Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          {user ? (
            <div className="flex items-center space-x-2">
              {!isDashboard && (
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              <div className="relative group">
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-transparent">
                  <User className="h-4 w-4 text-muted-foreground hover:text-brand-600 hover:bg-transparent transition-colors" />
                </Button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-popover border rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-sm font-medium">{user.email}</div>
                    <div className="h-px bg-border" />
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Billing
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            <div className="space-y-2">
              {isDashboard ? (
                // Dashboard Mobile Navigation
                <>
                  <Link 
                    href="/dashboard/create" 
                    className="block py-2 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create an AI
                  </Link>
                  <Link 
                    href="/dashboard/my-ais" 
                    className="block py-2 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My AIs
                  </Link>
                  <Link 
                    href="/dashboard/analytics" 
                    className="block py-2 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                  <Link 
                    href="/dashboard/settings" 
                    className="block py-2 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </>
              ) : (
                // Marketing Mobile Navigation
                <>
                  <Link 
                    href="#features" 
                    className="block py-2 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link 
                    href="#pricing" 
                    className="block py-2 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link 
                    href="/docs" 
                    className="block py-2 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Docs
                  </Link>
                </>
              )}
            </div>
            <div className="pt-4 border-t space-y-2">
              {user ? (
                <>
                  {!isDashboard && (
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
