import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AFTER_ERROR_MS,
  getAppCheckStatus,
  isRecaptchaResource,
  OVERALL_MS,
  onAppCheckStatus,
  setAppCheckStatus,
  watchAppCheck,
} from './appCheckStatus';

/** A token promise the test settles by hand, and a trigger for the reCAPTCHA load error. */
function setup() {
  let resolve!: (token: unknown) => void;
  let reject!: (error: unknown) => void;
  const token = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  let fireError: () => void = () => undefined;
  watchAppCheck({
    getToken: () => token,
    onRecaptchaError: (callback) => {
      fireError = callback;
    },
  });
  return { resolve, reject, fireError: () => fireError() };
}

describe('watchAppCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setAppCheckStatus('ok');
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is blocked shortly after a reCAPTCHA load error when no token comes', async () => {
    const { fireError } = setup();
    fireError();
    await vi.advanceTimersByTimeAsync(AFTER_ERROR_MS - 1);
    expect(getAppCheckStatus()).toBe('ok');
    await vi.advanceTimersByTimeAsync(1);
    expect(getAppCheckStatus()).toBe('blocked');
  });

  it('is blocked after the overall timeout with no error and no token', async () => {
    setup();
    await vi.advanceTimersByTimeAsync(OVERALL_MS - 1);
    expect(getAppCheckStatus()).toBe('ok');
    await vi.advanceTimersByTimeAsync(1);
    expect(getAppCheckStatus()).toBe('blocked');
  });

  it('stays ok with a cached token, even when the script is blocked', async () => {
    const { resolve, fireError } = setup();
    resolve({ token: 'cached' });
    await vi.advanceTimersByTimeAsync(0);
    fireError();
    await vi.advanceTimersByTimeAsync(OVERALL_MS * 2);
    expect(getAppCheckStatus()).toBe('ok');
  });

  it('counts a failed exchange (e.g. 403) as settled: Firestore goes on without a token', async () => {
    const { reject, fireError } = setup();
    fireError();
    reject(new Error('appCheck/fetch-status-error'));
    await vi.advanceTimersByTimeAsync(OVERALL_MS * 2);
    expect(getAppCheckStatus()).toBe('ok');
  });

  it('goes back to ok when a late token arrives, and notifies subscribers', async () => {
    const { resolve } = setup();
    const listener = vi.fn();
    const unsubscribe = onAppCheckStatus(listener);
    await vi.advanceTimersByTimeAsync(OVERALL_MS);
    expect(getAppCheckStatus()).toBe('blocked');
    resolve({ token: 'late' });
    await vi.advanceTimersByTimeAsync(0);
    expect(getAppCheckStatus()).toBe('ok');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});

describe('isRecaptchaResource', () => {
  const script = (src: string) => Object.assign(document.createElement('script'), { src });
  const link = (href: string) => Object.assign(document.createElement('link'), { href });

  it('matches reCAPTCHA scripts and preloads', () => {
    expect(
      isRecaptchaResource(script('https://www.google.com/recaptcha/enterprise.js?render=explicit')),
    ).toBe(true);
    expect(
      isRecaptchaResource(
        script('https://www.gstatic.com/recaptcha/releases/abc/recaptcha__en.js'),
      ),
    ).toBe(true);
    expect(isRecaptchaResource(link('https://www.google.com/recaptcha/enterprise.js'))).toBe(true);
  });

  it('ignores other resources and non-elements', () => {
    expect(isRecaptchaResource(script('https://soulsbuilds.com/assets/index.js'))).toBe(false);
    const img = Object.assign(document.createElement('img'), {
      src: 'https://www.google.com/recaptcha/x.png',
    });
    expect(isRecaptchaResource(img)).toBe(false);
    expect(isRecaptchaResource(null)).toBe(false);
    expect(isRecaptchaResource(window)).toBe(false);
  });
});
