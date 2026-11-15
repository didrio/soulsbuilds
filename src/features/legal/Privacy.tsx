import { Link } from 'react-router';
import LegalPage, { ISSUES_URL } from './LegalPage';

/**
 * Privacy policy. It describes only what the app actually does (docs/firebase.md); change it when the
 * data the app stores, or the services it uses, change.
 */
function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="15 November 2026">
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
          <strong>What you publish:</strong> your display name, your builds, your comments and which
          builds you like. These are public: anyone can see them, and your profile lists your builds
          and the builds you liked.
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
          Authentication and Cloud Firestore). Like any web server, Hosting logs requests, including
          your IP address.
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
        We don’t use analytics, ads or tracking cookies, and we don’t sell or share your data. Your
        browser keeps your sign-in in local storage so you stay signed in; reCAPTCHA may set its own
        Google cookies.
      </p>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep your data until you delete it or ask us to. You can delete your own builds and
        comments at any time from their page. To delete your account and everything you published,{' '}
        <a href={ISSUES_URL}>open an issue on GitHub</a> titled “Delete my account” with your
        display name. <strong>Don’t post your email address</strong>: issues are public. We’ll ask
        you to confirm the account is yours (for example by posting a code we give you as a comment
        on one of your builds), then delete it.
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
