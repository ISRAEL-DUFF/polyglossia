import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with a default value (e.g., false for desktop-first SSR)
  // This ensures the server and initial client render match.
  const [isMobile, setIsMobile] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true); // Mark that component has mounted
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkIsMobile(); // Check on mount

    // Corrected: Use `checkIsMobile` as the event listener directly
    window.addEventListener("resize", checkIsMobile);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
      mql.removeEventListener("change", checkIsMobile);
    }
  }, []);

  // Only return the true client-side value after mount to prevent hydration mismatch
  // Before mount, it will return the initial state (false), matching server assumption.
  if (!hasMounted) {
    return false; 
  }

  return isMobile;
}
