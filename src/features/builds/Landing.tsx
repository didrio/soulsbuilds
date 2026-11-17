import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { useCurrentGame } from '@/app/game';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ItemTile from '@/components/ui/ItemTile';
import PageHead from '@/components/ui/PageHead';
import PageMessage from '@/components/ui/PageMessage';
import { cardWeapons, iconUrl } from '@/data/core';
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
  SPACE_SM,
  SPACE_XL,
  SPACE_XXL,
  TEXT_NAME,
  TEXT_SM,
  TEXT_XS,
  WEIGHT_DISPLAY,
} from '@/theme';
import BuildsList from './BuildsList';
import { buildsHref } from './filters';
import LandingIntro from './LandingIntro';
import { useBuildsByIds, useFreshBuilds, useGameStats } from './queries';
import {
  arrangeShelves,
  SHELF_MIN,
  SHELF_SIZE,
  tagShelves,
  trendingIds,
  type Shelf,
} from './shelves';

/**
 * `/` (T74; order since T79): the home page curates; `/builds` is the full list. The intro first (the h1,
 * "View all builds", and closable getting-started panels), then Popular weapons, Trending (full rows),
 * and compact shelves two across: Top builds for the three most used tags, then Fresh builds (each "See
 * all" is `/builds` with that tag or sort). The shelves come from the daily search index (one read),
 * their builds read by id; Fresh builds from Firestore, so a new build shows at once.
 */
function Landing() {
  const game = useCurrentGame();
  const statsQuery = useGameStats();
  const stats = statsQuery.data;
  const index = stats?.searchIndex ?? [];

  const trending = trendingIds(index);
  const tags = tagShelves(index, stats?.tagCounts ?? {});
  const fresh = useFreshBuilds(SHELF_SIZE);
  const freshBuilds = fresh.data ?? [];
  // No index yet (before the daily job's first run since T74): the newest builds stand in for Trending,
  // so they don't get a shelf of their own as well.
  const freshShelf: Shelf | null =
    trending.length && freshBuilds.length >= SHELF_MIN
      ? {
          key: 'fresh',
          title: 'Fresh builds',
          caption: 'Just posted',
          href: buildsHref({ sort: 'new' }),
          ids: freshBuilds.map((build) => build.id),
        }
      : null;
  const shelves = arrangeShelves(tags, freshShelf);

  const indexIds = [...new Set([...trending, ...tags.flatMap((shelf) => shelf.ids)])];
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
  const lead = trending.length ? pick(trending) : freshBuilds;

  return (
    <>
      <PageHead {...homeMeta(game.name)} canonical={`${SITE_ORIGIN}/`} />
      <LandingIntro />

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

          {/* Two across; a lone shelf (no Top shelves yet) takes the full width with full rows (T79). */}
          {shelves.length ? (
            <Grid $single={shelves.length === 1}>
              {shelves.map((shelf) => (
                <ShelfSection
                  key={shelf.key}
                  id={`shelf-${shelf.key.replace(/[^a-z0-9]+/gi, '-')}`}
                  title={shelf.title}
                  caption={shelf.caption}
                  href={shelf.href}>
                  <BuildsList
                    builds={pick(shelf.ids)}
                    authors={authors}
                    compact={shelves.length > 1}
                  />
                </ShelfSection>
              ))}
            </Grid>
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

const Grid = styled.div<{ $single: boolean }>`
  display: grid;
  gap: ${SPACE_XXL};
  grid-template-columns: ${({ $single }) =>
    $single ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))'};

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

export default Landing;
