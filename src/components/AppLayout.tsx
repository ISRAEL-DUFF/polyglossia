
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import AppLogo from '@/components/AppLogo';
import NavItem from '@/components/NavItem';
import { Home, Microscope, Languages,Gamepad, Gamepad2Icon, NotebookTextIcon, Wand2, BookCopy, BookOpenText, BookMarked, BookText, History, Settings, BrainCircuit, Sparkles } from 'lucide-react';
import { SheetTitle } from '@/components/ui/sheet';
import PWAInstallButton from './PWAInstallButton';
import { usePathname } from 'next/navigation';

const dashboardNav = [{ href: '/', label: 'Dashboard', icon: Home }];

const greekToolsNav = [
  { href: '/greek', label: 'Lexicon', icon: Microscope },
  { href: '/greek-prepositions', label: 'Prepositions', icon: BookCopy },
  { href: '/greek-syntax-guide', label: 'Syntax Guide', icon: BookOpenText },
  { href: '/vocabulary-browser', label: 'Vocabulary', icon: NotebookTextIcon },
];

const hebrewToolsNav = [
  { href: '/hebrew', label: 'Lexicon', icon: Microscope },
  { href: '/hebrew-morph-builder', label: 'Morph Builder', icon: Wand2 },
  { href: '/hebrew-vowel-reconstruction', label: 'Vowel Reconstruction', icon: Languages },
];

const latinToolsNav = [
  { href: '/latin', label: 'Lexicon', icon: BookMarked },
  { href: '/latin-whitaker', label: 'Whitaker\'s Words', icon: BookText },
];

const gamesNav = [
  { href: '/matching-game', label: 'Matching Game', icon: Gamepad },
  { href: '/parser-game', label: 'Parser Game', icon: Gamepad2Icon },
  { href: '/flashcard-game', label: 'Flashcards', icon: BrainCircuit },
  { href: '/story-creator', label: 'AI Story Creator', icon: Sparkles },
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
  const pathname = usePathname();

  const isGreekActive = greekToolsNav.some(item => pathname.startsWith(item.href) && item.href !== '/');
  const isHebrewActive = hebrewToolsNav.some(item => pathname.startsWith(item.href));
  const isLatinActive = latinToolsNav.some(item => pathname.startsWith(item.href));
  const isGameActive = gamesNav.some(item => pathname.startsWith(item.href));

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 items-center flex justify-between">
          <MobileAwareSidebarHeaderElements />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {dashboardNav.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
             <SidebarGroup defaultOpen={isGreekActive}>
              <SidebarGroupLabel icon={Languages}>Greek Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {greekToolsNav.map((item) => (
                    <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup defaultOpen={isHebrewActive}>
              <SidebarGroupLabel icon={Languages}>Hebrew Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {hebrewToolsNav.map((item) => (
                    <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

             <SidebarGroup defaultOpen={isLatinActive}>
              <SidebarGroupLabel icon={Languages}>Latin Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {latinToolsNav.map((item) => (
                    <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup defaultOpen={isGameActive}>
              <SidebarGroupLabel icon={Gamepad}>Learning Games</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {gamesNav.map((item) => (
                    <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-sidebar-foreground/70 space-y-2">
          <PWAInstallButton />
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
