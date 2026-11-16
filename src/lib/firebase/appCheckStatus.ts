// Notices when App Check can't get a token at all (T24). `@firebase/app-check` loads Google's reCAPTCHA
// script with only an `onload` handler: if an ad/tracker blocker (or a network) blocks it, the SDK waits
// forever, and Firestore and Auth, which wait for the token before every request, never send anything. The
// page would stay empty with no error. This module only observes; `app.ts` wires it to the DOM and the SDK,
// and the shell's `AppCheckNotice` shows the explanation. Framework- and SDK-free so it can be unit tested.

export type AppCheckStatus = 'ok' | 'blocked';

/** After a reCAPTCHA script fails to load, how long a token may still take (a cached one takes ms). */
export const AFTER_ERROR_MS = 2_000;
/** With no load error seen (a hung connection, a blocked iframe), how long before we call it blocked. */
export const OVERALL_MS = 10_000;

let status: AppCheckStatus = 'ok';
const listeners = new Set<() => void>();

export function getAppCheckStatus(): AppCheckStatus {
  return status;
}

/** Subscribes to status changes; returns unsubscribe (the `useSyncExternalStore` shape). */
export function onAppCheckStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** For the watcher and tests. */
export function setAppCheckStatus(next: AppCheckStatus): void {
  if (next === status) return;
  status = next;
  for (const listener of listeners) listener();
}

/** True for a `<script>`/`<link>` loading Google reCAPTCHA (enterprise.js, or gstatic's recaptcha__*.js). */
export function isRecaptchaResource(target: EventTarget | null): boolean {
  const url =
    target instanceof HTMLScriptElement
      ? target.src
      : target instanceof HTMLLinkElement
        ? target.href
        : '';
  return url.includes('/recaptcha/');
}

interface WatchOptions {
  /** App Check's `getToken`; the SDK shares one request with Firestore's own call. */
  getToken: () => Promise<unknown>;
  /** Registers a callback for when a reCAPTCHA resource fails to load. */
  onRecaptchaError: (callback: () => void) => void;
}

/**
 * Blocked = the token hasn't settled `AFTER_ERROR_MS` after a reCAPTCHA load error, or `OVERALL_MS` after
 * start. Settling either way (a token, or an error such as the 403 bots get, after which Firestore goes on
 * with a placeholder token) means ok, also after a late token on a slow network.
 */
export function watchAppCheck({ getToken, onRecaptchaError }: WatchOptions): void {
  let settled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const blockLater = (ms: number) => {
    timers.push(
      setTimeout(() => {
        if (!settled) setAppCheckStatus('blocked');
      }, ms),
    );
  };
  const settle = () => {
    settled = true;
    timers.forEach(clearTimeout);
    setAppCheckStatus('ok');
  };

  blockLater(OVERALL_MS);
  onRecaptchaError(() => {
    if (!settled) blockLater(AFTER_ERROR_MS);
  });
  getToken().then(settle, settle);
}
