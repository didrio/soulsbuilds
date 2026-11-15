import { useEffect, useRef, type ReactNode } from 'react';

interface OutsideClickHandlerProps {
  children: ReactNode;
  onOutsideClick: (event: MouseEvent | TouchEvent) => void;
}

// Drop-in replacement for the unmaintained `react-outside-click-handler` (no React 19 support):
// renders a wrapper <div> and calls `onOutsideClick` on a mousedown/touchstart outside it.
function OutsideClickHandler({ children, onOutsideClick }: OutsideClickHandlerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onOutsideClick);

  useEffect(() => {
    callback.current = onOutsideClick;
  });

  useEffect(() => {
    const handle = (event: MouseEvent | TouchEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) {
        callback.current(event);
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

export default OutsideClickHandler;
