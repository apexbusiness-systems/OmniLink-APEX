import { Home, Link2, FileText, Zap, Package, LogOut, Brain, Gauge } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { useAdminAccess } from '@/omnidash/hooks';
import { OMNIDASH_FLAG } from '@/omnidash/types';

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const isCollapsed = state === 'collapsed';

  const navItems = [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Links', url: '/links', icon: Link2 },
    { title: 'Files', url: '/files', icon: FileText },
    { title: 'Automations', url: '/automations', icon: Zap },
    { title: 'Integrations', url: '/integrations', icon: Package },
    { title: 'APEX Assistant', url: '/apex', icon: Brain },
    ...(OMNIDASH_FLAG && isAdmin ? [{ title: 'OmniDash', url: '/omnidash', icon: Gauge }] : []),
  ];

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
          <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {!isCollapsed && <span>OmniLink</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'default'}
          onClick={signOut}
          className="w-full"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}