import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function getSection(pathname: string) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/producer")) return "producer";
  return "public";
}

export function ScrollToTop() {
  const { pathname } = useLocation();
  const prevSection = useRef(getSection(pathname));

  useEffect(() => {
    const currentSection = getSection(pathname);
    // Only scroll to top when changing sections or navigating within public routes
    if (currentSection !== prevSection.current || currentSection === "public") {
      window.scrollTo(0, 0);
    }
    prevSection.current = currentSection;
  }, [pathname]);

  return null;
}
