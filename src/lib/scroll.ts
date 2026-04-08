export function scrollPageToTop() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  window.scrollTo(0, 0);

  const root = document.scrollingElement;
  if (root) {
    root.scrollTop = 0;
    root.scrollLeft = 0;
  }

  document.documentElement.scrollTop = 0;
  document.documentElement.scrollLeft = 0;
  document.body.scrollTop = 0;
  document.body.scrollLeft = 0;

  document.querySelectorAll<HTMLElement>("[data-scroll-container]").forEach((container) => {
    container.scrollTop = 0;
    container.scrollLeft = 0;
  });
}