import { NavLink, Outlet } from 'react-router-dom';
import { AlertCircle, Activity, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAdminAccess, useOmniDashSettings } from '@/omnidash/hooks';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchHealthSnapshot, updateSettings } from '@/omnidash/api';
import { OMNIDASH_FLAG, OMNIDASH_SAFE_ENABLE_NOTE } from '@/omnidash/types';

const tabs = [
  { to: '/omnidash', label: 'Today' },
  { to: '/omnidash/pipeline', label: 'Pipeline' },
  { to: '/omnidash/kpis', label: 'KPIs' },
  { to: '/omnidash/ops', label: 'Ops' },
];

export const OmniDashLayout = () => {
  const { user } = useAuth();
  const { isAdmin, loading, featureEnabled } = useAdminAccess();
  const settings = useOmniDashSettings();

  const health = useQuery({
    queryKey: ['omnidash-health', user?.id],
    enabled: !!user && featureEnabled,
    queryFn: async () => {
      if (!user) throw new Error('User missing');
      return fetchHealthSnapshot(user.id);
    },
    refetchInterval: 60_000,
  });

  if (!OMNIDASH_FLAG) {
    return (
      <div className="p-6 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span>OmniDash is disabled. Set OMNIDASH_ENABLED=1 to enable. {OMNIDASH_SAFE_ENABLE_NOTE}</span>
        </div>
      </div>
    );
  }

  if (loading || settings.isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-6 w-32 bg-muted rounded" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>OmniDash is limited to admin users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Request admin access or add your email to VITE_OMNIDASH_ADMIN_EMAILS.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleSetting = async (key: 'demo_mode' | 'show_connected_ecosystem' | 'anonymize_kpis' | 'freeze_mode', value: boolean) => {
    await updateSettings(user!.id, { [key]: value });
    await settings.refetch();
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">OmniDash</h1>
            <Badge variant="secondary">Admin-only</Badge>
            <Badge variant={OMNIDASH_FLAG ? 'default' : 'outline'}>{OMNIDASH_FLAG ? 'Feature flag ON' : 'Feature flag OFF'}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Founder-facing control room for TradeLine 24/7 + FLOWBills.</p>
          {health.data?.lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Activity className="h-3 w-3" />
              <span>Last updated: {new Date(health.data.lastUpdated).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium border ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <Outlet />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Demo Toggles</CardTitle>
              <CardDescription>Controls for redaction and demo stories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Demo Mode</p>
                  <p className="text-sm text-muted-foreground">Redacts client names, PII, and buckets $ values.</p>
                </div>
                <Switch
                  checked={settings.data?.demo_mode}
                  onCheckedChange={(v) => toggleSetting('demo_mode', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Connected Ecosystem</p>
                  <p className="text-sm text-muted-foreground">Stub card for ecosystem view (no hub build required).</p>
                </div>
                <Switch
                  checked={settings.data?.show_connected_ecosystem}
                  onCheckedChange={(v) => toggleSetting('show_connected_ecosystem', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Anonymize KPIs</p>
                  <p className="text-sm text-muted-foreground">Buckets KPI values while in demo mode.</p>
                </div>
                <Switch
                  checked={settings.data?.anonymize_kpis}
                  onCheckedChange={(v) => toggleSetting('anonymize_kpis', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Freeze switch</p>
                  <p className="text-sm text-muted-foreground">When ON, limit work to bugfix + onboarding only.</p>
                </div>
                <Switch
                  checked={settings.data?.freeze_mode}
                  onCheckedChange={(v) => toggleSetting('freeze_mode', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Connected Ecosystem</CardTitle>
                <CardDescription>Stubbed for demo storytelling.</CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This card intentionally stubs the connected ecosystem view to keep the hub secure while enabling demo narratives.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OmniDashLayout;

