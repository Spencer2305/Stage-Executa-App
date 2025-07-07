import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";
import { NotificationProvider, NotificationContainer } from "@/components/ui/notification";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
        <NotificationContainer />
        <Toaster />
      </NotificationProvider>
    </AuthProvider>
  );
} 