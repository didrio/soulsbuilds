import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { useCurrentGame } from '@/app/game';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
import ItemTile from '@/components/ui/ItemTile';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import PageHead from '@/components/ui/PageHead';
import PageMessage from '@/components/ui/PageMessage';
import TextInput from '@/components/ui/TextInput';
import { labelText } from '@/components/ui/typography';
import { getCardWeapon, iconUrl } from '@/data/core';
import { useUserProfiles } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import type { Build } from '@/lib/models';
import { buildsMeta, SITE_ORIGIN } from '@/lib/share';
import {
  BELOW_MOBILE,
  COLOR_ACCENT_STRONG,
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
  TEXT_SM,
  TEXT_XL,
  WEIGHT_DISPLAY,
} from '@/theme';
import BuildsList from './BuildsList';
import FilterBar from './FilterBar';
import {
  BUILDS_PATH,
  filterBuilds,
  isFiltered,
  parseFilters,
  toSearchParams,
  weaponIdOf,
  type BuildFilters,
} from './filters';
import { useBuilds, useBuildSearch, useGameStats } from './queries';
import { resultCount, suggestions } from './search';

/**
 * `/builds` (T74): every build of the current game, a page at a time: search (words anywhere in the
 * name, weapons and tags, over the daily index), sort, and filter by level, tags and weapon. Without a
 * search, Firestore filters the level range and the weapon or first tag, and further tags filter the
 * loaded builds (a page can come back short: "Load more" fetches the next). Filters live in the URL.
 */
function BuildsPage() {
  const game = useCurrentGame();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const statsQuery = useGameStats();
  const stats = statsQuery.isPending ? undefined : (statsQuery.data ?? null);
  const searching = Boolean(filters.search);

  const list = useBuilds({
    sort: filters.sort,
    tag: filters.tags[0],
    weaponId: weaponIdOf(filters),
    minLevel: filters.minLevel,
    maxLevel: filters.maxLevel,
    enabled: !searching,
  });
  const search = useBuildSearch(filters, stats);
  const query = searching ? search : list;

  const [searchText, setSearchText] = useState(filters.search);
  const setFilters = (next: Partial<BuildFilters>) => {
    setSearchParams(toSearchParams({ ...filters, ...next }), { replace: true });
  };
  const applySearch = (event: FormEvent) => {
    event.preventDefault();
    setFilters({ search: searchText.trim() });
  };
  const clearSearch = () => {
    setSearchText('');
    setFilters({ search: '' });
  };
  const clearAll = () => {
    setSearchText('');
    setSearchParams(
      toSearchParams({ ...parseFilters(new URLSearchParams()), sort: filters.sort }),
      {
        replace: true,
      },
    );
  };

  const loaded: Build[] = searching
    ? (search.data?.pages.flatMap((page) => page.builds) ?? [])
    : (list.data?.pages.flatMap((page) => page.builds) ?? []);
  const shown = searching ? loaded : filterBuilds(loaded, filters);
  const authors = useUserProfiles(shown.map((build) => build.ownerId));
  const filtered = isFiltered(filters);

  const total = searching
    ? search.data?.pages[0]?.total
    : resultCount(shown.length, Boolean(list.hasNextPage), stats, filters);
  const countText = !query.isSuccess
    ? ''
    : total === undefined
      ? `${shown.length}+ builds`
      : `${total} ${total === 1 ? 'build' : 'builds'}`;
  const pages = searching && stats ? suggestions(filters.search, stats) : [];

  return (
    <>
      <PageHead {...buildsMeta(game.name)} canonical={`${SITE_ORIGIN}${BUILDS_PATH}`} />
      <Heading>
        <Title>{`${game.name} builds`}</Title>
        {stats && stats.buildCount > 0 ? (
          <Community>
            <b>{stats.buildCount}</b> {stats.buildCount === 1 ? 'build' : 'builds'} by{' '}
            <b>{stats.authorCount}</b> {stats.authorCount === 1 ? 'player' : 'players'}
          </Community>
        ) : null}
      </Heading>
      <SearchForm role="search" onSubmit={applySearch}>
        <SearchMark aria-hidden="true">
          <SearchIcon size={16} />
        </SearchMark>
        <TextInput
          id="build-search"
          aria-label="Search builds, weapons and tags"
          enterKeyHint="search"
          maxLength={80}
          onChange={setSearchText}
          placeholder="Search builds, weapons and tags"
          type="search"
          value={searchText}
        />
        {filters.search ? (
          <ClearSearch type="button" aria-label="Clear search" onClick={clearSearch}>
            <CloseIcon />
          </ClearSearch>
        ) : null}
      </SearchForm>
      <FilterBar filters={filters} onChange={setFilters} stats={stats} countText={countText} />

      {pages.length ? (
        <Pages aria-label="Pages for this search">
          <PagesLabel>Pages</PagesLabel>
          {pages.map((page) => (
            <PageLink key={page.path} to={page.path}>
              {page.id !== undefined ? <WeaponIcon id={page.id} /> : null}
              {page.kind === 'tag' ? `${page.name} builds` : page.name}
              <PageCount>
                {page.count} {page.count === 1 ? 'build' : 'builds'}
              </PageCount>
            </PageLink>
          ))}
        </Pages>
      ) : null}

      <Results>
        {query.isPending ? <PageMessage loading /> : null}
        {query.isError && !query.isFetchNextPageError ? (
          <PageMessage title="Couldn’t load builds">
            <ErrorMessage onRetry={() => void query.refetch()}>
              {errorMessage(query.error)}
            </ErrorMessage>
          </PageMessage>
        ) : null}
        {query.isSuccess && shown.length === 0 && !query.hasNextPage ? (
          <PageMessage
            title={
              searching
                ? `No builds match “${filters.search}”`
                : filtered
                  ? 'No builds match these filters'
                  : 'No builds yet'
            }>
            {searching || filtered ? (
              <Button variant="secondary" onClick={clearAll}>
                {searching ? 'Clear search and filters' : 'Clear filters'}
              </Button>
            ) : (
              <p>Be the first: plan one and save it.</p>
            )}
          </PageMessage>
        ) : null}
        {shown.length > 0 ? <BuildsList builds={shown} authors={authors} /> : null}
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
      </Results>
    </>
  );
}

function WeaponIcon({ id }: { id: number }) {
  const weapon = getCardWeapon(id);
  return weapon ? <ItemTile src={iconUrl(weapon.icon)} size={28} /> : null;
}

const Heading = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0 ${SPACE_MD};
  margin-top: ${SPACE_LG};

  @media ${BELOW_MOBILE} {
    margin-top: ${SPACE_MD};
  }
`;

const Title = styled.h1`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_XL};
  font-weight: ${WEIGHT_DISPLAY};
  line-height: 1.2;
  margin: 0;
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

const SearchForm = styled.form`
  margin: ${SPACE_MD} 0 0;
  position: relative;

  & > input {
    padding-left: 40px;
    padding-right: 44px;
  }
`;

const SearchMark = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  left: 14px;
  pointer-events: none;
  position: absolute;
  top: 14px;
`;

const ClearSearch = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  display: flex;
  height: 44px;
  justify-content: center;
  position: absolute;
  right: 0;
  top: 0;
  width: 44px;

  &:hover {
    color: ${COLOR_ACCENT_STRONG};
  }
`;

const Pages = styled.nav`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: ${SPACE_MD};
`;

const PagesLabel = styled.span`
  ${labelText}
  margin-right: 4px;
`;

const PageLink = styled(Link)`
  align-items: center;
  background: ${COLOR_SURFACE};
  border: 1px solid ${COLOR_LINE};
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT};
  display: inline-flex;
  font-size: ${TEXT_SM};
  gap: 8px;
  min-height: 44px;
  padding: 0 12px 0 8px;
  text-decoration: none;

  &:hover {
    border-color: ${COLOR_LINE_STRONG};
    color: ${COLOR_TEXT};
  }
`;

const PageCount = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-variant-numeric: tabular-nums;
`;

const Results = styled.div`
  margin-top: ${SPACE_MD};

  @media ${BELOW_MOBILE} {
    margin-top: ${SPACE_SM};
  }
`;

const LoadMore = styled.div`
  display: flex;
  justify-content: center;
  margin: ${SPACE_LG} 0;
`;

export default BuildsPage;
