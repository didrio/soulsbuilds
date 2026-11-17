// Usage counts (T38): GoatCounter, a cookie-free counter with no personal data and no consent banner.
// It counts page views and a few named events, only on the live site (never in dev, tests, the
// emulators or PR previews). docs/architecture.md "Usage counts"; the privacy page says what's counted.

const SCRIPT_URL = 'https://gc.zgo.at/count.js';
/** The site's own endpoint (public by design, like the Firebase web config). */
const COUNTER_URL = 'https://abhpro.goatcounter.com/count';
/** Only the production domain counts: the default Hosting domains redirect to it (index.html). */
const LIVE_HOST = 'soulsbuilds.com';

interface CountVars {
  /** A page's path, or an event's name when `event` is true. */
  path: string;
  event?: boolean;
  /** '' = no referrer (later pages of one visit); omitted = the browser's own. */
  referrer?: string;
}

type WithCounter = Window & { goatcounter?: { count?: (vars: CountVars) => void } };

/** Counts made before the script has loaded, sent when it has. */
const pending: CountVars[] = [];
let started = false;

export function usageEnabled(hostname: string = window.location.hostname): boolean {
  return hostname === LIVE_HOST;
}

function send(vars: CountVars) {
  const count = (window as WithCounter).goatcounter?.count;
  if (count) count(vars);
  else pending.push(vars);
}

/** Loads GoatCounter once (live site only). Page views are sent by `countPage`, not by the script. */
export function startUsage() {
  if (started || !usageEnabled()) return;
  started = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = SCRIPT_URL;
  script.dataset.goatcounter = COUNTER_URL;
  script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
  script.addEventListener('load', () => {
    for (const vars of pending.splice(0)) send(vars);
  });
  document.head.append(script);
}

/** One page view: the path only, never the query or hash (they can hold filters and email-link codes). */
export function countPage(path: string, referrer?: string) {
  if (!usageEnabled()) return;
  startUsage();
  send({ path, referrer });
}

/** A named event, e.g. 'tracking-started'. */
export function countEvent(name: UsageEvent) {
  if (!usageEnabled()) return;
  startUsage();
  send({ path: name, event: true });
}

export type UsageEvent =
  | 'tracking-started'
  | 'item-collected'
  | 'build-completed'
  | 'route-opened'
  | 'share-link'
  | 'share-reddit'
  | 'share-image'
  | 'share-native'
  // T68: the planner opened signed out, and a sign-in (or sign-up) started from its Save.
  | 'planner-opened-signed-out'
  | 'signed-in-to-save'
  // T69: the home page intro's three buttons.
  | 'intro-plan'
  | 'intro-example'
  | 'intro-browse';
