'use client';

import { useEffect } from 'react';
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
  SidebarTrigger
} from '@/components/ui/sidebar';
import { LayoutDashboard, Files, FileCheck, Archive, FileTerminal } from 'lucide-react';

export default function RecChairLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/rec-chair/auth');

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
        <div className="flex h-screen w-full p-10">
          <Sidebar>
            <SidebarHeader className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">REC Chair</span>
              </div>
              <SidebarTrigger />
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === '/rec-chair'}
                    onClick={() => router.push('/rec-chair')}
                  >
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname?.includes('/rec-chair/applications')}
                    onClick={() => router.push('/rec-chair/applications')}
                  >
                    <Files />
                    <span>Applications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname?.includes('/rec-chair/progress-report')}
                    onClick={() => router.push('/rec-chair/progress-report')}
                  >
                    <FileCheck />
                    <span>Progress Report</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname?.includes('/rec-chair/final-report')}
                    onClick={() => router.push('/rec-chair/final-report')}
                  >
                    <FileCheck />
                    <span>Final Report</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname?.includes('/rec-chair/archiving')}
                    onClick={() => router.push('/rec-chair/archiving')}
                  >
                    <Archive />
                    <span>Archiving</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname?.includes('/rec-chair/termination')}
                    onClick={() => router.push('/rec-chair/termination')}
                  >
                    <FileTerminal />
                    <span>Termination</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="px-4 py-2">
              <div className="text-sm">
                Signed in as: {user?.email}
              </div>
            </SidebarFooter>
          </Sidebar>
          <div className="flex-1 overflow-auto">
            <main className="p-4">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Return nothing while redirecting
  return null;
}
