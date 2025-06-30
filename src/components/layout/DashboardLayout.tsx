"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/state/userStore";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Bot, 
  BarChart3, 
  Settings, 
  LogOut,
  Ticket,
  HelpCircle
} from "lucide-react";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useUserStore();
  const pathname = usePathname();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: '',
    priority: 'NORMAL',
    description: '',
    userEmail: user?.email || '',
    userName: user?.name || ''
  });
  const [isSubmittingSupportTicket, setIsSubmittingSupportTicket] = useState(false);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My AIs",
      href: "/dashboard/my-ais",
      icon: Bot,
    },
    {
      name: "Ticket Manager",
      href: "/dashboard/tickets",
      icon: Ticket,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSupportTicket(true);

    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/support/executa-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supportForm)
      });

      if (!response.ok) {
        throw new Error('Failed to submit support ticket');
      }

      toast.success("Support ticket submitted successfully! We'll get back to you soon.");
      setIsSupportModalOpen(false);
      setSupportForm({
        subject: '',
        category: '',
        priority: 'NORMAL',
        description: '',
        userEmail: user?.email || '',
        userName: user?.name || ''
      });
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error("Failed to submit support ticket. Please try again.");
    } finally {
      setIsSubmittingSupportTicket(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard" className="flex items-center">
            <div className="relative h-8 w-32">
              <Image
                src="/Executa-logo.png"
                alt="Executa Logo"
                fill
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-primary text-white shadow-md hover:bg-primary/90 hover:text-white"
                      : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Support Button - Positioned at bottom above user section */}
        <div className="px-4 pb-4">
          <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-slate-300 hover:text-slate-100 hover:bg-slate-800/60">
                <HelpCircle className="mr-3 h-5 w-5" />
                Support
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Contact Executa Support</DialogTitle>
                <DialogDescription>
                  Need help with the Executa platform? Submit a support ticket and our team will get back to you quickly.
                </DialogDescription>
              </DialogHeader>
                              <form onSubmit={handleSupportSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="userName" className="mb-2 block">Your Name</Label>
                      <Input
                        id="userName"
                        value={supportForm.userName}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, userName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="userEmail" className="mb-2 block">Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={supportForm.userEmail}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, userEmail: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="subject" className="mb-2 block">Subject</Label>
                    <Input
                      id="subject"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="mb-2 block">Category</Label>
                      <Select value={supportForm.category} onValueChange={(value) => setSupportForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing & Plans</SelectItem>
                          <SelectItem value="feature-request">Feature Request</SelectItem>
                          <SelectItem value="account">Account Management</SelectItem>
                          <SelectItem value="integration">Integration Help</SelectItem>
                          <SelectItem value="general">General Question</SelectItem>
                          <SelectItem value="bug-report">Bug Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority" className="mb-2 block">Priority</Label>
                      <Select value={supportForm.priority} onValueChange={(value) => setSupportForm(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="mb-2 block">Description</Label>
                    <Textarea
                      id="description"
                      value={supportForm.description}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Please provide detailed information about your issue..."
                      rows={4}
                      required
                    />
                  </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSupportModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingSupportTicket}>
                    {isSubmittingSupportTicket ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* User section */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar 
              src={user?.avatar}
              name={user?.name}
              email={user?.email}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-slate-300 hover:text-slate-100 hover:bg-slate-800/60"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-white pt-8">
          {children}
        </main>
      </div>
    </div>
  );
} 