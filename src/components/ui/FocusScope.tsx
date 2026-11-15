import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type FocusScopeProps = ComponentPropsWithoutRef<'div'> & {
  /** Escape inside the scope calls this (close the dialog or panel). */
  onEscape: () => void;
  /** Keep Tab cycling inside (modal dialogs). Off for non-modal panels. */
  trap?: boolean;
};

/**
 * Keyboard handling for dialogs and panels: on mount, focuses the first focusable element inside;
 * Escape calls `onEscape`; with `trap`, Tab and Shift+Tab wrap around inside; on unmount, focus
 * goes back to whatever had it before (the button that opened it). Renders a wrapper `<div>`.
 */
function FocusScope({ onEscape, trap = false, children, ...rest }: FocusScopeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const escape = useRef(onEscape);

  useEffect(() => {
    escape.current = onEscape;
  });

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = () => [...container.querySelectorAll<HTMLElement>(FOCUSABLE)];
    (focusables()[0] ?? container).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        escape.current();
        return;
      }
      if (!trap || event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [trap]);

  return (
    <div ref={ref} tabIndex={-1} {...rest}>
      {children}
    </div>
  );
}

export default FocusScope;
