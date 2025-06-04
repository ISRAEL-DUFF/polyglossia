import * as React from "react"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from 'react';

const GreekInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.keyman) {
      window.keyman.init({ attachType: 'manual' }).then(() => {
        window.keyman.addKeyboards('@en');
        window.keyman.addKeyboards('sil_greek_polytonic@el');

        if(inputRef && inputRef.current) {
            window.keyman.attachToControl(inputRef.current)
            window.keyman.enableControl(inputRef.current)
        }
      })
    }
  }, []);


  // this is only to stop the warning message for react
  function fakeOnChange() {
    console.log('Fake onChange called:')
  }

  // Listen for native input events (including Keyman changes)
    useEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      const handler = (e: Event) => {
        if (onChange) {
          // Create a synthetic event to match React's onChange signature
          onChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
        }
      };
      el.addEventListener('input', handler);
      return () => el.removeEventListener('input', handler);
    }, [onChange]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={inputRef}
        {...props}
        onChange={fakeOnChange}
      />
    )
  }
)
GreekInput.displayName = "GreekInput"

export { GreekInput }
