import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';

/** Any URL that isn't a route. */
function NotFound() {
  return (
    <PageMessage title="Page not found">
      <p>There’s nothing at this address.</p>
      <TextLink to="/">Browse builds</TextLink>
    </PageMessage>
  );
}

export default NotFound;
