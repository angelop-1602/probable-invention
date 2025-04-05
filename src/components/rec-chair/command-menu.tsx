'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Files, 
  FileCheck, 
  Archive, 
  ArchiveX, 
  LogOut
} from 'lucide-react';
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator, 
  CommandShortcut 
} from '@/components/ui/command';
import { useAuthContext } from '@/lib/auth-context';

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { signOut } = useAuthContext();

  React.useEffect(() => {
    // Track keys pressed for double key press detection
    let lastKeyPressed = '';
    let lastKeyTime = 0;
    
    const down = (e: KeyboardEvent) => {
      // Open command menu with Ctrl + Alt + `
      if (e.key === '`' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        setOpen((open) => !open);
        return;
      }

      // Only handle keyboard shortcuts if not in an input field
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle other keyboard shortcuts
      if (e.ctrlKey && e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            router.push('/rec-chair');
            break;
          case 'a':
            e.preventDefault();
            router.push('/rec-chair/applications');
            break;
          case 'p':
            e.preventDefault();
            router.push('/rec-chair/progress-report');
            break;
          case 'f':
            e.preventDefault();
            router.push('/rec-chair/final-report');
            break;
          case 'r':
            e.preventDefault();
            router.push('/rec-chair/archiving');
            break;
          case 't':
            e.preventDefault();
            router.push('/rec-chair/termination');
            break;
          case 'q':
            e.preventDefault();
            // Check if this is a double press of Q
            const now = Date.now();
            if (lastKeyPressed === 'q' && now - lastKeyTime < 500) {
              // Double Q press detected
              signOut();
            }
            lastKeyPressed = 'q';
            lastKeyTime = now;
            break;
        }
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [router, signOut]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/rec-chair'))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>Ctrl+Alt+D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/rec-chair/applications'))}
          >
            <Files className="mr-2 h-4 w-4" />
            <span>Applications</span>
            <CommandShortcut>Ctrl+Alt+A</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/rec-chair/progress-report'))}
          >
            <FileCheck className="mr-2 h-4 w-4" />
            <span>Progress Reports</span>
            <CommandShortcut>Ctrl+Alt+P</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/rec-chair/final-report'))}
          >
            <FileCheck className="mr-2 h-4 w-4" />
            <span>Final Reports</span>
            <CommandShortcut>Ctrl+Alt+F</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/rec-chair/archiving'))}
          >
            <Archive className="mr-2 h-4 w-4" />
            <span>Archiving</span>
            <CommandShortcut>Ctrl+Alt+R</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/rec-chair/termination'))}
          >
            <ArchiveX className="mr-2 h-4 w-4" />
            <span>Termination</span>
            <CommandShortcut>Ctrl+Alt+T</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => runCommand(() => signOut())}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
            <CommandShortcut>Ctrl+Alt+Q+Q</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
} 