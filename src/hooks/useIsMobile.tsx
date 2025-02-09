import { useState, useCallback, useEffect } from "react";

const INNER_WIDTH_THRESHOLD = 800;
// For horizontal orientation.
const INNER_HEIGHT_THRESHOLD = 500;

function isScreenMobileDimensions(): boolean {
  return window.innerWidth < INNER_WIDTH_THRESHOLD || window.innerHeight < INNER_HEIGHT_THRESHOLD;
}

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(isScreenMobileDimensions());
  const handleResize = useCallback(() => {
    setIsMobile(isScreenMobileDimensions());
  }, []);
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}
