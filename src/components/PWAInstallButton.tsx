
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const { toast } = useToast();

  const registerServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[App] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    // Register Service Worker on component mount (after window.load)
    if (typeof window !== 'undefined') {
      window.addEventListener('load', registerServiceWorker);
    }
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
      console.log('[App] beforeinstallprompt event captured.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log('[App] PWA was installed.');
      setShowButton(false);
      setDeferredPrompt(null);
       toast({
        title: "App Installed!",
        description: "Polyglossia Praxis is now installed on your device.",
      });
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', registerServiceWorker);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [registerServiceWorker, toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[App] Deferred prompt not available.');
      toast({
        title: "Already Installed or Not Available",
        description: "The app might already be installed, or installation is not currently available.",
        variant: "default",
      });
      return;
    }
    
    setShowButton(false); // Hide button immediately
    deferredPrompt.prompt();
    
    try {
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[App] User response to the install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        console.log('[App] User accepted the PWA installation.');
         // The 'appinstalled' event will handle the toast for success
      } else {
        console.log('[App] User dismissed the PWA installation.');
        toast({
          title: "Installation Cancelled",
          description: "You can install the app later from the browser menu or if the prompt reappears.",
          variant: "default",
        });
        // Optionally: Reshow button after a delay if dismissed, or respect user choice
        // For now, it stays hidden after dismissal to avoid being intrusive
      }
    } catch (error) {
      console.error('[App] Error during PWA installation prompt:', error);
      toast({
        title: "Installation Error",
        description: "Something went wrong during the installation process.",
        variant: "destructive",
      });
    } finally {
      setDeferredPrompt(null); // Prompt can only be used once
    }
  };

  if (!showButton) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 h-auto py-2"
      aria-label="Install Polyglossia Praxis App"
    >
      <Download className="h-4 w-4" />
      <span>Install App</span>
    </Button>
  );
};

export default PWAInstallButton;
