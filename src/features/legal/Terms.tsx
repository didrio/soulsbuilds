import { Link } from 'react-router';
import LegalPage, { ISSUES_URL } from './LegalPage';

/** Terms of use: plain rules for a small community site. */
function Terms() {
  return (
    <LegalPage title="Terms of use" path="/terms" updated="15 November 2026">
      <p>
        By using Souls Builds you agree to these terms. If you don’t agree, please don’t use the
        site.
      </p>

      <h2>Your account</h2>
      <p>
        Keep your password to yourself; you’re responsible for what’s posted from your account.
        Don’t pick a display name that impersonates someone else.
      </p>

      <h2>What you post</h2>
      <p>
        Your builds, comments and display name stay yours. By posting them you let us store them and
        show them publicly on Souls Builds. You’re responsible for what you post.
      </p>
      <p>Don’t post anything that:</p>
      <ul>
        <li>harasses, threatens or demeans people, or is hateful;</li>
        <li>is spam, advertising or deliberately misleading;</li>
        <li>shares someone else’s personal information;</li>
        <li>is illegal, or infringes someone else’s rights.</li>
      </ul>
      <p>
        Don’t abuse the site either: no scraping, automated posting, or attempts to get around its
        security.
      </p>

      <h2>Moderation</h2>
      <p>
        Anyone signed in can report a build or comment. We may remove content or accounts that break
        these terms, without notice.
      </p>

      <h2>No guarantees</h2>
      <p>
        Souls Builds is a free hobby project, provided as is. Build data may be wrong or out of
        date, and the site may change, go down or close. To the extent the law allows, we aren’t
        liable for any loss from using it.
      </p>

      <h2>Fan site</h2>
      <p>
        Souls Builds is not affiliated with or endorsed by FromSoftware or Bandai Namco. ELDEN RING,
        its item names, data and icons are trademarks and copyright of FromSoftware, Inc. and Bandai
        Namco Entertainment Inc.
      </p>

      <h2>Changes and questions</h2>
      <p>
        If these terms change, we’ll update this page and the date above. Questions:{' '}
        <a href={ISSUES_URL}>GitHub issues</a>. How we handle your data: the{' '}
        <Link to="/privacy">privacy policy</Link>.
      </p>
    </LegalPage>
  );
}

export default Terms;
