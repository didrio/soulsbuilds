import PageHead from '@/components/ui/PageHead';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import { pageTitle } from '@/lib/share';

/** Any URL that isn't a route. */
function NotFound() {
  return (
    <PageMessage title="Page not found">
      <PageHead title={pageTitle('Page not found')} noindex />
      <p>There’s nothing at this address.</p>
      <TextLink to="/">Browse builds</TextLink>
    </PageMessage>
  );
}

export default NotFound;
