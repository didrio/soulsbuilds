import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { useCurrentGame } from '@/app/game';
import { ButtonLink } from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { SearchIcon } from '@/components/ui/icons';
import ItemTile from '@/components/ui/ItemTile';
import PageHead from '@/components/ui/PageHead';
import PageMessage from '@/components/ui/PageMessage';
import { cardWeapons, iconUrl } from '@/data/core';
import useAuth from '@/features/auth/useAuth';
import { useUserProfiles } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import { popularWeapons } from '@/lib/hubs';
import type { Build } from '@/lib/models';
import { homeMeta, SITE_ORIGIN } from '@/lib/share';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_SURFACE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  RADIUS_FRAME,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  SPACE_XL,
  SPACE_XXL,
  TEXT_NAME,
  TEXT_SM,
  TEXT_XL,
  TEXT_XS,
  WEIGHT_DISPLAY,
} from '@/theme';
import BuildsList from './BuildsList';
import { BUILDS_PATH, buildsHref } from './filters';
import { LIST_HEADING_ID } from './intro';
import LandingIntro from './LandingIntro';
import { useBuildsByIds, useFreshBuilds, useGameStats } from './queries';
import {
  arrangeShelves,
  indexShelves,
  SHELF_MIN,
  SHELF_SIZE,
  trendingIds,
  type Shelf,
} from './shelves';

/**
 * `/` (T74): the home page curates; `/builds` is the full list. Signed out, the intro (T69) first. Then
 * Trending (full rows), compact shelves two across (Most played, Fresh builds, Top builds for the most
 * used tags; each "See all" is `/builds` with that sort or tag), Popular weapons, and the way to every
 * build. The shelves come from the daily search index (one read), their builds read by id; Fresh
 * builds from Firestore, so a new build shows at once.
 */
function Landing() {
  const game = useCurrentGame();
  const auth = useAuth();
  // T69: signed-out visitors get the intro, which holds the page's h1; the title steps down to h2.
  const intro = !auth.loading && !auth.uid;
  const statsQuery = useGameStats();
  const stats = statsQuery.data;
  const index = stats?.searchIndex ?? [];

  const trending = trendingIds(index);
  const { played, tags } = indexShelves(index, stats?.tagCounts ?? {});
  const fresh = useFreshBuilds(SHELF_SIZE);
  const freshBuilds = fresh.data ?? [];
  const freshShelf: Shelf | null =
    freshBuilds.length >= SHELF_MIN
      ? {
          key: 'fresh',
          title: 'Fresh builds',
          caption: 'Just posted',
          href: buildsHref({ sort: 'new' }),
          ids: freshBuilds.map((build) => build.id),
        }
      : null;
  const shelves = arrangeShelves(played, freshShelf, tags);

  const indexIds = [
    ...new Set([...trending, ...(played?.ids ?? []), ...tags.flatMap((shelf) => shelf.ids)]),
  ];
  const byIds = useBuildsByIds(indexIds);
  const builds = new Map<string, Build>(
    [...(byIds.data ?? []), ...freshBuilds].map((build) => [build.id, build]),
  );
  const pick = (ids: readonly string[]) => ids.flatMap((id) => builds.get(id) ?? []);
  const authors = useUserProfiles([...builds.values()].map((build) => build.ownerId));
  const weapons = popularWeapons(stats?.weaponCounts, 8);

  const loading =
    statsQuery.isPending || fresh.isPending || (indexIds.length > 0 && byIds.isPending);
  const failed = statsQuery.error ?? fresh.error ?? byIds.error;
  const total = stats?.buildCount ?? 0;
  // No index yet (before the daily job's first run since T74): the newest builds stand in for Trending.
  const lead = trending.length ? pick(trending) : freshBuilds;

  return (
    <>
      <PageHead {...homeMeta(game.name)} canonical={`${SITE_ORIGIN}/`} />
      {intro ? <LandingIntro /> : null}
      <Heading>
        <Title as={intro ? 'h2' : 'h1'} id={LIST_HEADING_ID} tabIndex={-1}>
          {`${game.name} builds`}
        </Title>
        {stats && total > 0 ? (
          <Community>
            <b>{total}</b> {total === 1 ? 'build' : 'builds'} by <b>{stats.authorCount}</b>{' '}
            {stats.authorCount === 1 ? 'player' : 'players'}
          </Community>
        ) : null}
        <AllLink to={BUILDS_PATH}>
          <SearchIcon size={16} />
          Search and filter all builds
        </AllLink>
      </Heading>

      {loading ? <PageMessage loading /> : null}
      {failed && !loading ? (
        <PageMessage title="Couldn’t load builds">
          <ErrorMessage
            onRetry={() => {
              void statsQuery.refetch();
              void fresh.refetch();
              void byIds.refetch();
            }}>
            {errorMessage(failed)}
          </ErrorMessage>
        </PageMessage>
      ) : null}

      {!loading && !failed ? (
        <Shelves>
          {lead.length ? (
            <ShelfSection
              id="shelf-trending"
              title={trending.length ? 'Trending' : 'Fresh builds'}
              caption={trending.length ? 'Liked and played lately' : 'Just posted'}>
              <BuildsList builds={lead} authors={authors} />
            </ShelfSection>
          ) : (
            <PageMessage title="No builds yet">
              <p>Be the first: plan one and save it.</p>
            </PageMessage>
          )}

          {trending.length && shelves.length ? (
            <Grid>
              {shelves.map((shelf) => (
                <ShelfSection
                  key={shelf.key}
                  id={`shelf-${shelf.key.replace(/[^a-z0-9]+/gi, '-')}`}
                  title={shelf.title}
                  caption={shelf.caption}
                  href={shelf.href}>
                  <BuildsList builds={pick(shelf.ids)} authors={authors} compact />
                </ShelfSection>
              ))}
            </Grid>
          ) : null}

          {weapons.length ? (
            <ShelfSection
              id="shelf-weapons"
              title="Popular weapons"
              caption="Each with its builds and where to find it">
              <Weapons>
                {weapons.map(({ name, path, count }) => {
                  const weapon = cardWeapons.find((card) => card.name === name);
                  return (
                    <li key={path}>
                      <WeaponLink to={path}>
                        <ItemTile src={weapon ? iconUrl(weapon.icon) : null} size={36} />
                        {name}
                        <WeaponCount>
                          {count} {count === 1 ? 'build' : 'builds'}
                        </WeaponCount>
                      </WeaponLink>
                    </li>
                  );
                })}
              </Weapons>
            </ShelfSection>
          ) : null}

          {total > 0 ? (
            <ViewAll>
              <ButtonLink to={BUILDS_PATH}>View all {total} builds</ButtonLink>
            </ViewAll>
          ) : null}
        </Shelves>
      ) : null}
    </>
  );
}

/** A shelf: its heading, a caption, "See all" (to the builds page) and its builds. */
function ShelfSection({
  id,
  title,
  caption,
  href,
  children,
}: {
  id: string;
  title: string;
  caption: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <ShelfHead>
        <ShelfTitle id={id}>{title}</ShelfTitle>
        <Caption>{caption}</Caption>
        {href ? (
          <SeeAll to={href} aria-label={`See all: ${title}`}>
            See all →
          </SeeAll>
        ) : null}
      </ShelfHead>
      {children}
    </section>
  );
}

const Heading = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} ${SPACE_MD};
  margin: ${SPACE_LG} 0 ${SPACE_XL};

  @media ${BELOW_MOBILE} {
    margin: ${SPACE_MD} 0 ${SPACE_LG};
  }
`;

const Title = styled.h1`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_XL};
  font-weight: ${WEIGHT_DISPLAY};
  line-height: 1.2;
  margin: 0;
  scroll-margin-top: ${SPACE_LG};
`;

const Community = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;

  & > b {
    color: ${COLOR_TEXT};
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
`;

const AllLink = styled(ButtonLink)`
  margin-left: auto;

  @media ${BELOW_MOBILE} {
    margin-left: 0;
    width: 100%;
  }
`;

const Shelves = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACE_XXL};

  @media ${BELOW_MOBILE} {
    gap: ${SPACE_XL};
  }
`;

const ShelfHead = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 4px ${SPACE_SM};
  margin-bottom: ${SPACE_SM};
`;

const ShelfTitle = styled.h2`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_NAME};
  font-weight: ${WEIGHT_DISPLAY};
  line-height: 1.2;
  margin: 0;
`;

const Caption = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
`;

const SeeAll = styled(Link)`
  align-items: center;
  display: inline-flex;
  font-size: ${TEXT_SM};
  font-weight: 500;
  margin-left: auto;
  min-height: 44px;
  text-decoration: none;
  white-space: nowrap;
`;

const Grid = styled.div`
  display: grid;
  gap: ${SPACE_XXL};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media ${BELOW_TABLET} {
    gap: ${SPACE_XL};
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Weapons = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const WeaponLink = styled(Link)`
  align-items: center;
  background: ${COLOR_SURFACE};
  border: 1px solid ${COLOR_LINE};
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT};
  display: inline-flex;
  font-size: ${TEXT_SM};
  gap: ${SPACE_SM};
  min-height: 52px;
  padding: 0 14px 0 8px;
  text-decoration: none;

  &:hover {
    border-color: ${COLOR_LINE_STRONG};
    color: ${COLOR_TEXT};
  }
`;

const WeaponCount = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
`;

const ViewAll = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${SPACE_LG};
`;

export default Landing;
