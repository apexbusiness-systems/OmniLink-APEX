import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CloudSetupMessage } from '@/components/CloudSetupMessage';
import {
  markDeviceTrusted,
  syncOnLogin,
  startBackgroundDeviceSync,
  stopBackgroundDeviceSync,
  upsertDevice,
} from '@/zero-trust/deviceRegistry';
import { recordAuditEvent } from '@/security/auditLog';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudConfigured, setCloudConfigured] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Lovable Cloud backend is configured with fallbacks
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL ??
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ??
      (import.meta as any).env?.PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ??
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      (import.meta as any).env?.PUBLIC_SUPABASE_ANON_KEY ??
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Lovable Cloud publishable key
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        'Missing Supabase environment variables. Checked: VITE_SUPABASE_URL | NEXT_PUBLIC_SUPABASE_URL | PUBLIC_SUPABASE_URL and VITE_SUPABASE_ANON_KEY | NEXT_PUBLIC_SUPABASE_ANON_KEY | PUBLIC_SUPABASE_ANON_KEY | VITE_SUPABASE_PUBLISHABLE_KEY'
      );
      setCloudConfigured(false);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      stopBackgroundDeviceSync();
      return;
    }
    const deviceId = localStorage.getItem('device_id') || crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
    const fingerprint = navigator.userAgent;

    (async () => {
      await syncOnLogin(session.user.id);
      await upsertDevice(session.user.id, deviceId, { fingerprint }, 'suspect');
      await markDeviceTrusted(deviceId);
      startBackgroundDeviceSync(session.user.id);
      recordAuditEvent({
        actorId: session.user.id,
        actionType: 'login',
        resourceType: 'session',
        resourceId: deviceId,
        metadata: { fingerprint },
      });
    })();
    return () => stopBackgroundDeviceSync();
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    stopBackgroundDeviceSync();
    if (session?.user) {
      recordAuditEvent({
        actorId: session.user.id,
        actionType: 'logout',
        resourceType: 'session',
        resourceId: 'self',
      });
    }
    navigate('/auth');
  };

  // Show setup message if Cloud is not configured
  if (!cloudConfigured) {
    return <CloudSetupMessage />;
  }

  return (
    <AuthContext.Provider value={{ user, session, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};