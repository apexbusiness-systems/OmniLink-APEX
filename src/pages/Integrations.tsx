import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Check, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Integrations = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [webnamesIntegration, setWebnamesIntegration] = useState<any>(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    apiUsername: '',
  });

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  const fetchIntegrations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'webnames')
      .single();

    if (!error && data) {
      setWebnamesIntegration(data);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('integrations')
        .upsert({
          user_id: user?.id,
          name: 'Webnames.ca',
          type: 'webnames',
          status: 'active',
          config: {
            apiKey: formData.apiKey,
            apiUsername: formData.apiUsername,
          },
        })
        .select()
        .single();

      if (error) throw error;

      setWebnamesIntegration(data);
      setIsDialogOpen(false);
      setFormData({ apiKey: '', apiUsername: '' });
      toast.success('Webnames.ca integration connected successfully!');
      fetchIntegrations();
    } catch (error) {
      console.error('Error connecting integration:', error);
      toast.error('Failed to connect integration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!webnamesIntegration) return;

    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', webnamesIntegration.id);

      if (error) throw error;

      setWebnamesIntegration(null);
      toast.success('Webnames.ca integration disconnected');
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast.error('Failed to disconnect integration');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect external services and APIs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Webnames.ca Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Webnames.ca</CardTitle>
                  <CardDescription>Domain management</CardDescription>
                </div>
              </div>
              {webnamesIntegration && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">Connected</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage your domains and DNS records directly from your dashboard.
            </p>
            <div className="flex gap-2">
              {webnamesIntegration ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        Configure
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Webnames.ca Configuration</DialogTitle>
                        <DialogDescription>
                          Update your Webnames.ca API credentials
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleConnect} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiUsername">API Username</Label>
                          <Input
                            id="apiUsername"
                            placeholder="Your API username"
                            value={formData.apiUsername}
                            onChange={(e) => setFormData({ ...formData, apiUsername: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">API Key</Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="Your API key"
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Updating...' : 'Update Configuration'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={handleDisconnect}
                    title="Disconnect"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Connect</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect Webnames.ca</DialogTitle>
                      <DialogDescription>
                        Enter your Webnames.ca API credentials to connect your account.
                        <a 
                          href="https://www.webnames.ca/account/api" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline mt-2"
                        >
                          Get your API credentials
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConnect} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiUsername">API Username</Label>
                        <Input
                          id="apiUsername"
                          placeholder="Your API username"
                          value={formData.apiUsername}
                          onChange={(e) => setFormData({ ...formData, apiUsername: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="Your API key"
                          value={formData.apiKey}
                          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Connecting...' : 'Connect Integration'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Integrations;