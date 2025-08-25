import { useState, useEffect } from "react";

export function useSafari() {
  const [isSafari, setIsSafari] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const detectSafari = () => {
      const userAgent = navigator.userAgent;

      // Detect Safari
      const safari = /^((?!chrome|android).)*safari/i.test(userAgent);

      // Detect iOS
      const ios = /iPad|iPhone|iPod/.test(userAgent);

      // Detect WebKit (Safari, Chrome, etc.)
      const webkit = /WebKit/.test(userAgent);

      // More specific Safari detection
      const isSafariBrowser = safari && webkit && !/Chrome/.test(userAgent);

      setIsSafari(isSafariBrowser);
      setIsIOS(ios);
    };

    detectSafari();
  }, []);

  return { isSafari, isIOS };
}
