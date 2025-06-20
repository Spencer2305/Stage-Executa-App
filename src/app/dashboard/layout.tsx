import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/providers/AuthGuard";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
} 