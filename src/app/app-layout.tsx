import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, ListTree, LogOut, Users } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BrandMark } from '@/components/brand-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useMe } from '@/features/auth/use-me';
import { t, type TranslationKey } from '@/i18n';
import { clearToken } from '@/lib/token';

const NAV: { to: string; label: TranslationKey; icon: typeof Users; end: boolean }[] = [
  { to: '/', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'nav.users', icon: Users, end: false },
  { to: '/catalog', label: 'nav.catalog', icon: ListTree, end: false },
];

function AppSidebar() {
  const { pathname } = useLocation();
  const isActive = (to: string, end: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b px-3">
        <BrandMark />
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.section')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive(item.to, item.end)}
                    tooltip={t(item.label)}
                    className="h-10 font-medium data-[active=true]:font-semibold"
                  >
                    <NavLink to={item.to} end={item.end}>
                      <item.icon />
                      <span>{t(item.label)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function TopBar() {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const username = me.data?.username;

  function logout() {
    clearToken();
    queryClient.clear();
    void navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-backdrop-filter:bg-background/70 md:px-6">
      <SidebarTrigger className="-ms-1" />
      <div className="flex-1" />
      <ThemeToggle />
      {username && (
        <div className="flex items-center gap-2 rounded-full border bg-card py-1 ps-1 pe-3">
          <span
            className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground uppercase"
            aria-hidden
          >
            {username.slice(0, 1)}
          </span>
          <span className="text-sm font-medium" data-testid="admin-username">
            {username}
          </span>
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={logout} aria-label={t('nav.logout')}>
        <LogOut data-icon="inline-start" />
        <span className="hidden sm:inline">{t('nav.logout')}</span>
      </Button>
    </header>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
