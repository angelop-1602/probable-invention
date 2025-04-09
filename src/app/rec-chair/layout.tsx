'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/lib/auth-context';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { LayoutDashboard, Files, FileCheck, Archive, ArchiveX, NotebookPen } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandMenu } from '@/components/rec-chair/command-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function RecChairLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user, signOut } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/rec-chair/auth');

  // Generate breadcrumb items based on the current path
  const generateBreadcrumbs = () => {
    if (!pathname) return [];

    // Split the path and remove empty strings
    const pathSegments = pathname.split('/').filter(Boolean);

    // Start with REC Chair as the base
    const breadcrumbs = [{ label: 'REC Chair', path: '/rec-chair' }];

    // Add segments to breadcrumbs (skip 'rec-chair' as it's already added)
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      if (segment === 'rec-chair') return;

      currentPath += `/${segment}`;
      const fullPath = `/rec-chair${currentPath}`;

      // Format the label (capitalize and replace hyphens with spaces)
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({ label, path: fullPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isAuthPage) {
        // Not authenticated and not on auth page, redirect to sign-in
        router.push('/rec-chair/auth/sign-in');
      } else if (isAuthenticated && isAuthPage) {
        // Already authenticated but on auth page, redirect to dashboard
        router.push('/rec-chair');
      }
    }
  }, [isAuthenticated, loading, router, isAuthPage]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If on auth page, just render the children without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Only render sidebar layout if authenticated and not on auth page
  if (isAuthenticated && !isAuthPage) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar>
            <SidebarHeader className="flex flex-col items-center px-4 gap-4">
              <div className="relative w-35 h-35 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(254,204,7,1) 0%, rgba(254,204,7,0.5) 40%, rgba(254,204,7,0) 70%)'
                  }}
                ></div>
                <img src="/SPUP-final-logo.png" alt="SPUP Logo" className="w-28 h-28 object-contain relative z-10" />
              </div>
              <div className="text-center">
                <span className="block text-4xl font-bold tracking-wider">
                  SPUP
                </span>
                <span className="block text-sm font-bold mt-1">Research Ethics Committee</span>
              </div>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent className='pt-4 pl-2'>
              <SidebarMenu className="space-y-3">
                <SidebarMenuItem className="mb-2">
                  <SidebarMenuButton
                    className="py-3 px-4 text-base transition-all duration-200 hover:translate-x-1"
                    isActive={pathname === '/rec-chair'}
                    onClick={() => router.push('/rec-chair')}
                  >
                    <LayoutDashboard className="h-6 w-6 mr-3" />
                    <span className="text-lg">Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="mb-2">
                  <SidebarMenuButton
                    className="py-3 px-4 text-base transition-all duration-200 hover:translate-x-1"
                    isActive={pathname?.includes('/rec-chair/applications')}
                    onClick={() => router.push('/rec-chair/applications')}
                  >
                    <Files className="h-6 w-6 mr-3" />
                    <span className="text-lg">Applications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="mb-2">
                  <SidebarMenuButton
                    className="py-3 px-4 text-base transition-all duration-200 hover:translate-x-1"
                    isActive={pathname?.includes('/rec-chair/progress-report')}
                    onClick={() => router.push('/rec-chair/progress-report')}
                  >
                    <FileCheck className="h-6 w-6 mr-3" />
                    <span className="text-lg">Progress Report</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="mb-2">
                  <SidebarMenuButton
                    className="py-3 px-4 text-base transition-all duration-200 hover:translate-x-1"
                    isActive={pathname?.includes('/rec-chair/final-report')}
                    onClick={() => router.push('/rec-chair/final-report')}
                  >
                    <FileCheck className="h-6 w-6 mr-3" />
                    <span className="text-lg">Final Report</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="mb-2">
                  <SidebarMenuButton
                    className="py-3 px-4 text-base transition-all duration-200 hover:translate-x-1"
                    isActive={pathname?.includes('/rec-chair/archiving')}
                    onClick={() => router.push('/rec-chair/archiving')}
                  >
                    <Archive className="h-6 w-6 mr-3" />
                    <span className="text-lg">Archiving</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="mb-2">
                  <SidebarMenuButton
                    className="py-3 px-4 text-base transition-all duration-200 hover:translate-x-1"
                    isActive={pathname?.includes('/rec-chair/termination')}
                    onClick={() => router.push('/rec-chair/termination')}
                  >
                    <ArchiveX className="h-6 w-6 mr-3" />
                    <span className="text-lg">Termination</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="mb-2">
                  <SidebarMenuButton
                    className="py-3 px-4 text-base transition-all duration-200 hover:translate-x-1"
                    isActive={pathname?.includes('/rec-chair/reviewers')}
                    onClick={() => router.push('/rec-chair/reviewers')}
                  >
                    <NotebookPen className="h-6 w-6 mr-3" />
                    <span className="text-lg">Primary Reviewers</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>

            <SidebarSeparator />

            <SidebarFooter>
              <div className="text-xs flex flex-col gap-2">
                <p>© 2024 SPUP Research Ethics</p>
                <div className="text-sm">
                  {user?.email}
                </div>
                <div>
                  Press <kbd className="px-1 py-0.5 text-xs border rounded bg-background text-foreground border-border">Ctrl+Alt+`</kbd> for commands
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 overflow-auto flex flex-col">
            <header className="flex sticky top-0 h-16 shrink-0 items-center gap-2 border-b bg-background border-border px-4 z-10 shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={breadcrumb.path}>
                      <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                        {index < breadcrumbs.length - 1 ? (
                          <BreadcrumbLink href={breadcrumb.path}>{breadcrumb.label}</BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex items-center gap-4">
                <div className="border-r border-border pr-4 mr-2">
                  <ThemeToggle />
                </div>
                <Button variant="outline" onClick={signOut} className="flex items-center gap-2">
                  <LogOut />
                  Sign Out
                </Button>
              </div>
            </header>
            <main className="flex-1 p-10 overflow-auto relative">
              {children}
            </main>
          </div>
        </div>
        <CommandMenu />
      </SidebarProvider>
    );
  }

  // Return nothing while redirecting
  return null;
}
