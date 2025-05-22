
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
  useSidebar, 
} from '@/components/ui/sidebar';
import AppLogo from '@/components/AppLogo';
import NavItem from '@/components/NavItem';
import { Home, Microscope, Languages, Volume2, NotebookTextIcon } from 'lucide-react';
import { SheetTitle } from '@/components/ui/sheet';
import PWAInstallButton from './PWAInstallButton'; // Import PWAInstallButton

const navItems = [
  { href: '/', label: 'Text Viewer', icon: NotebookTextIcon },
  { href: '/greek', label: 'Greek Lexicon tools', icon: Volume2 },
  { href: '/hebrew', label: 'Hebrew Lexicon tools', icon: Volume2 },
  { href: '/vocabulary-browser', label: 'Vocabulary browser', icon: Volume2 },
  { href: '/matching-game', label: 'Vocabulary matching game', icon: Volume2 },
  { href: '/parser-game', label: 'Greek word parsing game', icon: Volume2 },
];

const MobileAwareSidebarHeaderElements = () => {
  const { isMobile } = useSidebar(); 

  return (
    <>
      {isMobile ? (
        <SheetTitle asChild>
          <AppLogo />
        </SheetTitle>
      ) : (
        <AppLogo />
      )}
      <SidebarTrigger className="md:hidden" />
    </>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 items-center flex justify-between">
          <MobileAwareSidebarHeaderElements />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-sidebar-foreground/70 space-y-2">
          <PWAInstallButton /> {/* Added PWA Install Button */}
          <div>Polyglossia Praxis &copy; {new Date().getFullYear()}</div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4 md:hidden">
          <SidebarTrigger /> 
          <AppLogo />
        </header>
        <main className="flex-1 p-6 overflow-auto animate-fadeInUp">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
