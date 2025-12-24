import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchIncidents, addIncident } from '@/omnidash/api';
import { useOmniDashSettings } from '@/omnidash/hooks';
import { Incident } from '@/omnidash/types';
import { format } from 'date-fns';

export const Ops = () => {
  const { user } = useAuth();
  const settings = useOmniDashSettings();
  const queryClient = useQueryClient();

  const incidentsQuery = useQuery({
    queryKey: ['omnidash-incidents', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('User required');
      return fetchIncidents(user.id, 25);
    },
  });

  const [form, setForm] = useState<{ title: string; severity: Incident['severity']; description: string }>({
    title: '',
    severity: 'sev2',
    description: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User required');
      await addIncident({
        user_id: user.id,
        title: form.title,
        severity: form.severity,
        description: form.description,
      });
    },
    onSuccess: () => {
      setForm({ title: '', severity: 'sev2', description: '' });
      queryClient.invalidateQueries({ queryKey: ['omnidash-incidents', user?.id] });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Freeze switch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            When freeze is ON, only bugfix and onboarding tasks are permitted. Current status:
          </p>
          <Badge variant={settings.data?.freeze_mode ? 'destructive' : 'secondary'}>
            {settings.data?.freeze_mode ? 'Freeze ON' : 'Freeze OFF'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log new incident</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Title</p>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Severity</p>
            <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v as Incident['severity'] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sev1">Sev-1</SelectItem>
                <SelectItem value="sev2">Sev-2</SelectItem>
                <SelectItem value="sev3">Sev-3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <p className="text-sm font-medium">Description</p>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Log incident</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incident log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {incidentsQuery.data?.length === 0 && <p className="text-sm text-muted-foreground">No incidents recorded.</p>}
          {incidentsQuery.data?.map((incident) => (
            <div key={incident.id} className="border rounded-md p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={incident.severity === 'sev1' ? 'destructive' : 'outline'} className="capitalize">
                    {incident.severity}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">{incident.status}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(incident.occurred_at), 'MMM d, HH:mm')}
                </span>
              </div>
              <p className="font-semibold">{incident.title}</p>
              {incident.description && <p className="text-sm text-muted-foreground">{incident.description}</p>}
              {incident.resolution_notes && (
                <p className="text-xs text-muted-foreground">Resolution: {incident.resolution_notes}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Ops;

