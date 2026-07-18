import { requirePlatformRole } from "@/lib/auth/require-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Building2, CreditCard, Brain, Settings } from "lucide-react";

export default async function ControlCenterLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, errorRes } = await requirePlatformRole([
    'SUPER_ADMIN',
    'FINANCE',
    'SUPPORT',
    'ANALYST'
  ]);

  if (errorRes || !userProfile) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="font-bold text-lg text-primary tracking-tight">Atlas Control Center</div>
        <nav className="flex items-center gap-6 ml-6 text-sm font-medium">
          <Link href="/control-center" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Link>
          <Link href="/control-center/businesses" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Building2 className="h-4 w-4" /> Businesses
          </Link>
          <Link href="/control-center/revenue" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <CreditCard className="h-4 w-4" /> Revenue
          </Link>
          <Link href="/control-center/ai" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Brain className="h-4 w-4" /> AI Telemetry
          </Link>
          <Link href="/control-center/system" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" /> System
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm font-medium border px-2 py-1 rounded bg-muted/50">
            Role: {userProfile.platformRole}
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Exit to Dashboard
          </Link>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
