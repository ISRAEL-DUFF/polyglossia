
"use client";

import type React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import AppLogo from '@/components/AppLogo';
import NavItem from '@/components/NavItem';
import { Home, Microscope, Languages, Volume2, NotebookTextIcon } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Text Viewer', icon: NotebookTextIcon },
  { href: '/morphology', label: 'Morphological Analyzer', icon: Microscope },
  { href: '/translation', label: 'Translation Assistant', icon: Languages },
  { href: '/pronunciation', label: 'Pronunciation Guides', icon: Volume2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 items-center flex justify-between">
          <AppLogo />
          <SidebarTrigger className="md:hidden" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-sidebar-foreground/70">
          Polyglossia Praxis &copy; {new Date().getFullYear()}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4 md:hidden">
          {/* Mobile header might include a trigger if sidebar starts closed on mobile */}
          <SidebarTrigger /> 
          <AppLogo />
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
