import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import PageMessage from '@/components/ui/PageMessage';
import SectionHeading from '@/components/ui/SectionHeading';
import BuildsList from '@/features/builds/BuildsList';
import { useUserProfiles } from '@/features/profile/queries';
import { errorMessage, type BuildPage } from '@/lib/firebase';
import { SPACE_LG, SPACE_XL } from '@/theme';

export type HubQuery = UseInfiniteQueryResult<InfiniteData<BuildPage>>;

/**
 * A hub page's builds (T55): a heading, the landing's rows, "Load more"; `empty` when there are none.
 * Most liked first, so the best builds lead.
 */
function HubBuilds({
  query,
  heading,
  empty,
}: {
  query: HubQuery;
  heading: string;
  empty: ReactNode;
}) {
  const builds = query.data?.pages.flatMap((page) => page.builds) ?? [];
  const authors = useUserProfiles(builds.map((build) => build.ownerId));
  return (
    <Section aria-labelledby="hub-builds">
      <SectionHeading id="hub-builds">{heading}</SectionHeading>
      {query.isPending ? <PageMessage loading /> : null}
      {query.isError && !query.isFetchNextPageError ? (
        <PageMessage title="Couldn’t load builds">
          <ErrorMessage onRetry={() => void query.refetch()}>
            {errorMessage(query.error)}
          </ErrorMessage>
        </PageMessage>
      ) : null}
      {query.isSuccess && builds.length === 0 ? empty : null}
      {builds.length > 0 ? <BuildsList builds={builds} authors={authors} /> : null}
      {query.hasNextPage ? (
        <LoadMore>
          {query.isFetchingNextPage ? (
            <LoadingAnimation size={30} />
          ) : (
            <Button variant="secondary" onClick={() => void query.fetchNextPage()}>
              Load more builds
            </Button>
          )}
        </LoadMore>
      ) : null}
      {query.isFetchNextPageError ? (
        <ErrorMessage onRetry={() => void query.fetchNextPage()}>
          {errorMessage(query.error)}
        </ErrorMessage>
      ) : null}
    </Section>
  );
}

/** Builds on the first page: what decides `noindex` (undefined while loading). */
export const firstPageCount = (query: HubQuery): number | undefined =>
  query.data?.pages[0]?.builds.length;

const Section = styled.section`
  margin-top: ${SPACE_XL};
`;

const LoadMore = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${SPACE_LG};
`;

export default HubBuilds;
