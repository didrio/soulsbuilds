import { Link } from 'react-router';
import LegalPage, { ISSUES_URL } from './LegalPage';

/**
 * Privacy policy. It describes only what the app actually does (docs/firebase.md); change it when the
 * data the app stores, or the services it uses, change.
 */
function Privacy() {
  return (
    <LegalPage title="Privacy policy" path="/privacy" updated="16 November 2026">
      <p>
        Souls Builds is a small fan site for sharing Elden Ring character builds. This page explains
        what we store about you, why, and how to get it removed.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Your account:</strong> your email address and password, kept by Firebase
          Authentication (a Google service). Your password is stored hashed by Google; we never see
          it. We use your email only to sign you in, to verify your address and to reset your
          password. It is never shown on the site.
        </li>
        <li>
          <strong>Signing in with Google:</strong> instead of a password, Google tells Firebase
          Authentication your Google account’s email address, name and profile picture, which it
          keeps with your account. The site uses only the email, to sign you in; it never shows your
          Google name or picture. You choose your display name yourself.
        </li>
        <li>
          <strong>What you publish:</strong> your display name, your builds, your comments and
          replies, and which builds and comments you like. These are public: anyone can see them,
          and your profile lists your builds and the builds you liked.
        </li>
        <li>
          <strong>Builds you track:</strong> when you track a build, which of its items you’ve
          marked collected, the stat levels you’ve entered, and when you started and finished. This
          is private: only you can see it, on your profile’s Playing and Completed tabs. Tracking
          needs an account, so it’s stored with your account and nowhere else. A build only shows
          how many people play it and have finished it, never who.
        </li>
        <li>
          <strong>Reports:</strong> if you report a build or comment, we store the reason, your note
          and your account ID. Only the site’s moderators can see reports.
        </li>
      </ul>

      <h2>Services we use</h2>
      <ul>
        <li>
          <strong>Google Firebase</strong> hosts the site and stores the data above (Hosting,
          Authentication, Cloud Firestore and a Cloud Function that makes link previews). Like any
          web server, Hosting and the function log requests, including your IP address.
        </li>
        <li>
          <strong>GoatCounter</strong> counts visits so we can see what people use. It sets no
          cookies and stores no personal data: it counts the pages opened (their path, never your
          search or filters), the site that sent you, your country, browser and screen size, and a
          few actions (like starting to track a build, checking off an item, opening a build’s
          route, sharing one, starting a build without an account, or which button on the home page
          you used). Counts are anonymous and can’t be tied to your account. See{' '}
          <a href="https://www.goatcounter.com/help/privacy">GoatCounter’s privacy notes</a>.
        </li>
        <li>
          <strong>reCAPTCHA Enterprise</strong> (through Firebase App Check) checks that requests
          come from this site and not from abusive scripts. It collects information about your
          browser and device and sends it to Google. This site is protected by reCAPTCHA, and the
          Google <a href="https://policies.google.com/privacy">Privacy Policy</a> and{' '}
          <a href="https://policies.google.com/terms">Terms of Service</a> apply.
        </li>
      </ul>
      <p>
        We don’t use ads or tracking cookies, and we don’t sell or share your data. Your browser
        keeps your sign-in in local storage so you stay signed in; reCAPTCHA may set its own Google
        cookies.
      </p>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep your data until you delete it or ask us to. You can delete your own builds and
        comments at any time from their page. Replies other people wrote to a comment you delete
        stay, under “Comment deleted”.
      </p>
      <p>
        To delete your account, open <strong>Account</strong> from the menu under your name, choose{' '}
        <strong>Delete account</strong> at the bottom and enter your password (or, if you signed up
        with Google, confirm with Google). This deletes your account, your builds (with their likes
        and comments), your comments and likes on other builds, your reports and the builds you
        track, straight away. Copies may stay for a while in the backups the site’s maintainer keeps
        privately.
      </p>
      <p>
        If you can’t sign in any more, <a href={ISSUES_URL}>open an issue on GitHub</a> titled
        “Delete my account” with your display name. <strong>Don’t post your email address</strong>:
        issues are public. We’ll ask you to confirm the account is yours, then delete it.
      </p>

      <h2>Children</h2>
      <p>Souls Builds is not meant for children under 13, and they shouldn’t create an account.</p>

      <h2>Changes and questions</h2>
      <p>
        If this policy changes, we’ll update this page and the date above. Questions:{' '}
        <a href={ISSUES_URL}>GitHub issues</a>. See also the <Link to="/terms">terms of use</Link>.
      </p>
    </LegalPage>
  );
}

export default Privacy;
