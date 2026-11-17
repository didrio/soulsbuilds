import { useParams } from 'react-router';
import styled from 'styled-components';
import NotFound from '@/app/NotFound';
import { useCurrentGame } from '@/app/game';
import PageHead from '@/components/ui/PageHead';
import PageHero from '@/components/ui/PageHero';
import { TextLink } from '@/components/ui/TextButton';
import { useBuilds } from '@/features/builds/queries';
import { toSearchParams, DEFAULT_FILTERS } from '@/features/builds/filters';
import { indexable, tagBySlug, tagHubHeading, tagHubMeta, tagUrl } from '@/lib/hubs';
import { COLOR_TEXT_MUTED } from '@/theme';
import HubBuilds, { firstPageCount } from './HubBuilds';

/** `/tags/:slug` (T55): every build with a tag, most liked first. */
function TagPage() {
  const { slug = '' } = useParams();
  const tag = tagBySlug(slug);
  if (!tag) return <NotFound />;
  return <TagHub key={tag} tag={tag} />;
}

function TagHub({ tag }: { tag: string }) {
  const game = useCurrentGame();
  const builds = useBuilds({ sort: 'top', tag });
  const count = firstPageCount(builds);
  const filter = toSearchParams({ ...DEFAULT_FILTERS, tags: [tag] });
  return (
    <>
      <PageHead
        {...tagHubMeta(tag, game.name)}
        canonical={tagUrl(tag)}
        noindex={count !== undefined && !indexable(count)}
      />
      <PageHero
        title={tagHubHeading(tag)}
        tagline={`${game.name} builds tagged ${tag}, most liked first.`}>
        <More>
          <TextLink to={`/?${filter.toString()}`}>Filter by level or sort them</TextLink>
        </More>
      </PageHero>
      <HubBuilds
        query={builds}
        heading="Community builds"
        empty={
          <Empty>
            No builds tagged {tag} yet. <TextLink to="/build/new">Make the first one</TextLink>
          </Empty>
        }
      />
    </>
  );
}

const More = styled.p`
  margin: 8px 0 0;
`;

const Empty = styled.p`
  color: ${COLOR_TEXT_MUTED};
  margin: 0;
`;

export default TagPage;
