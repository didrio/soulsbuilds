import { Link } from 'react-router';
import PageMessage from '@/components/ui/PageMessage';

/** Any URL that isn't a route. */
function NotFound() {
  return (
    <PageMessage title="Page not found">
      <p>There’s nothing at this address.</p>
      <Link to="/">Browse builds</Link>
    </PageMessage>
  );
}

export default NotFound;
