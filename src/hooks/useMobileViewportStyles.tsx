import React from "react";
import { useIsMobile } from "./useIsMobile";


export const useMobileViewportStyles = () => {
  const isMobile = useIsMobile();
  const rootElement: HTMLDivElement | null = document.querySelector("#root")
  React.useEffect(() => {
    if (isMobile && rootElement) {
      const viewPortH = rootElement?.getBoundingClientRect().height;
      const windowH = window.innerHeight;
      const browserUiBarsH = viewPortH - windowH;
      rootElement.style.height = `calc(100vh - ${browserUiBarsH}px)`;
    }
  }, [rootElement, isMobile])
}