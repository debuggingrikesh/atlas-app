import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, CreditCard, Brain } from "lucide-react";

export default async function ControlCenterOverview() {
  // Data Access Layer - Initial Overview Metrics
  const [
    totalBusinesses,
    totalUsers,
    activeSubscriptions,
    aiUsageLogs
  ] = await Promise.all([
    prisma.business.count({ where: { deletedAt: null } }),
    prisma.userProfile.count({ where: { isActive: true } }),
    prisma.businessSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.aIUsageLog.aggregate({
      _sum: {
        inputTokens: true,
        outputTokens: true,
      }
    })
  ]);

  const totalTokens = (aiUsageLogs._sum.inputTokens || 0) + (aiUsageLogs._sum.outputTokens || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBusinesses}</div>
            <p className="text-xs text-muted-foreground">Total registered businesses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Platform wide user accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Paid tier accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Tokens Consumed</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total Gemini token usage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
