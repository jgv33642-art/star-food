import { useEffect, useRef } from 'react';

type UseBarcodeScannerProps = {
  onScan: (barcode: string) => void;
  minDuration?: number; // Maximum time between keystrokes in ms to be considered a scan
  prefixChars?: string[]; // Optional prefix chars sent by scanner
  suffixChars?: string[]; // Suffix char, usually 'Enter'
};

export function useBarcodeScanner({
  onScan,
  minDuration = 50,
  prefixChars = [],
  suffixChars = ['Enter']
}: UseBarcodeScannerProps) {
  const buffer = useRef('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, etc.
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // If the scanner hits Enter while focused on an input, you might want to handle it,
        // but typically barcode scanners type very fast. 
        // We'll let normal inputs handle their own onChange.
        return;
      }

      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastKeyTime.current;
      
      // Reset buffer if time between keystrokes is too long (human typing)
      if (timeDiff > minDuration && buffer.current.length > 0) {
        buffer.current = '';
      }

      if (suffixChars.includes(e.key)) {
        if (buffer.current.length > 3) { // Arbitrary minimum length for a barcode
          onScan(buffer.current);
          e.preventDefault(); // Prevent default enter behavior (like submitting a form)
        }
        buffer.current = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only append single characters
        buffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, minDuration, prefixChars, suffixChars]);
}
