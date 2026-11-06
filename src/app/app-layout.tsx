import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Database, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useCollections } from '@/features/collections/api';
import { useMe } from '@/features/auth/use-me';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { clearToken } from '@/lib/token';

const NAV = [
  { to: '/', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'nav.users', icon: Users, end: false },
  { to: '/catalog', label: 'nav.catalog', icon: BookOpen, end: false },
] as const;

function CollectionsMenu() {
  const { pathname } = useLocation();
  const collections = useCollections();

  if (collections.isPending) {
    return Array.from({ length: 4 }, (_, index) => (
      <SidebarMenuItem key={index}>
        <SidebarMenuSkeleton />
      </SidebarMenuItem>
    ));
  }
  if (collections.isError) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => void collections.refetch()}>
          {t('nav.collectionsError')}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return collections.data.map((collection) => {
    const to = `/data/${collection.name}`;
    return (
      <SidebarMenuItem key={collection.name}>
        <SidebarMenuButton asChild isActive={pathname === to} tooltip={collection.name}>
          <NavLink to={to}>
            <span className="truncate font-mono text-xs">{collection.name}</span>
          </NavLink>
        </SidebarMenuButton>
        <SidebarMenuBadge>{formatNumber(collection.count)}</SidebarMenuBadge>
      </SidebarMenuItem>
    );
  });
}

function AppSidebar() {
  const { pathname } = useLocation();
  const isActive = (to: string, end: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Database className="size-4" aria-hidden />
          </div>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {t('app.name')}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.to, item.end)}
                    tooltip={t(item.label)}
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
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel asChild>
            <NavLink to="/data">{t('nav.dataBrowser')}</NavLink>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <CollectionsMenu />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function TopBar() {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function logout() {
    clearToken();
    queryClient.clear();
    void navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="me-2 h-4" />
      <div className="flex-1" />
      {me.data && (
        <span className="text-sm text-muted-foreground" data-testid="admin-username">
          {me.data.username}
        </span>
      )}
      <ThemeToggle />
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut data-icon="inline-start" />
        {t('nav.logout')}
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
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
