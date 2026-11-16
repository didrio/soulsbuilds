import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import { useCurrentGame } from '@/app/game';
import Button from '@/components/ui/Button';
import Chips from '@/components/ui/Chips';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Frame from '@/components/ui/Frame';
import { SearchIcon } from '@/components/ui/icons';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import PageMessage from '@/components/ui/PageMessage';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TextInput from '@/components/ui/TextInput';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { TextButton } from '@/components/ui/TextButton';
import { useUserProfiles } from '@/features/profile/queries';
import { MAX_LEVEL } from '@/lib/buildMath';
import { errorMessage, type BuildSort } from '@/lib/firebase';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  TEXT_SM,
  TEXT_XL,
  TEXT_XS,
  WEIGHT_DISPLAY,
} from '@/theme';
import BuildsList from './BuildsList';
import {
  clampLevel,
  filterBuilds,
  parseFilters,
  toggleTag,
  topTags,
  toSearchParams,
  type BuildFilters,
} from './filters';
import { useBuilds, useGameStats } from './queries';
import { labelText } from '@/components/ui/typography';

const SORTS = [
  { value: 'top', label: 'Most liked' },
  { value: 'new', label: 'Newest' },
] as const satisfies readonly { value: BuildSort; label: string }[];

/**
 * `/`: the current game's builds, most liked or newest first, a page at a time, or a search by name.
 * The search, the first tag and the level range filter in Firestore; further tags filter the loaded
 * builds (a page can come back short: "Load more" fetches the next). Filters live in the URL.
 */
function Landing() {
  const game = useCurrentGame();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const builds = useBuilds({
    sort: filters.sort,
    tag: filters.tags[0],
    search: filters.search || undefined,
    minLevel: filters.minLevel,
    maxLevel: filters.maxLevel,
  });

  const [searchText, setSearchText] = useState(filters.search);
  const [minText, setMinText] = useState(String(filters.minLevel));
  const [maxText, setMaxText] = useState(String(filters.maxLevel));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const stats = useGameStats().data;
  const top = stats ? topTags(stats.tagCounts) : [];
  const topNames = new Set(top.map(({ tag }) => tag));

  const setFilters = (next: Partial<BuildFilters>) => {
    setSearchParams(toSearchParams({ ...filters, ...next }), { replace: true });
  };

  const applyLevels = (event?: FormEvent) => {
    event?.preventDefault();
    let min = clampLevel(minText, 1);
    let max = clampLevel(maxText, filters.maxLevel);
    if (min > max) [min, max] = [max, min];
    setMinText(String(min));
    setMaxText(String(max));
    setFilters({ minLevel: min, maxLevel: max });
  };

  const applySearch = (event: FormEvent) => {
    event.preventDefault();
    setFilters({ search: searchText.trim() });
  };

  const clearSearch = () => {
    setSearchText('');
    setFilters({ search: '' });
  };

  const clearFilters = () => {
    setSearchText('');
    setMinText('1');
    setMaxText(String(MAX_LEVEL));
    setFilters({ search: '', tags: [], minLevel: 1, maxLevel: MAX_LEVEL });
  };

  const loaded = builds.data?.pages.flatMap((page) => page.builds) ?? [];
  const shown = filterBuilds(loaded, filters);
  const authors = useUserProfiles(shown.map((build) => build.ownerId));
  const filtered = toSearchParams({ ...filters, sort: 'top' }).size > 0;
  const levelFiltered = filters.minLevel !== 1 || filters.maxLevel !== MAX_LEVEL;
  const activeCount = filters.tags.length + (levelFiltered ? 1 : 0);

  const status = filters.search
    ? `Builds whose name starts with “${filters.search}”`
    : filters.sort === 'top'
      ? 'Most liked first'
      : 'Newest first';

  return (
    <>
      <FindFrame aria-labelledby="landing-title">
        <Title id="landing-title">{`${game.name} Builds`}</Title>
        <Toolbar>
          <SearchForm role="search" onSubmit={applySearch}>
            <FieldLabel htmlFor="build-search">Search</FieldLabel>
            <SearchField>
              <TextInput
                id="build-search"
                aria-label="Search builds by name"
                enterKeyHint="search"
                maxLength={80}
                onChange={setSearchText}
                placeholder="Build name"
                type="search"
                value={searchText}
              />
              <SearchSubmit type="submit" aria-label="Search">
                <SearchIcon />
              </SearchSubmit>
            </SearchField>
          </SearchForm>
          <FiltersToggle
            variant="secondary"
            aria-expanded={filtersOpen}
            aria-controls="build-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}>
            {activeCount ? `Filters · ${activeCount} active` : 'Filters'}
          </FiltersToggle>
          <Collapsible id="build-filters" $open={filtersOpen}>
            <Field>
              <FieldLabel as="span">Sort</FieldLabel>
              {filters.search ? (
                <Note>By name while searching</Note>
              ) : (
                <SegmentedControl
                  label="Sort builds"
                  options={SORTS}
                  value={filters.sort}
                  onChange={(sort) => setFilters({ sort })}
                />
              )}
            </Field>
            <Field as="form" onSubmit={applyLevels} aria-label="Level range">
              <FieldLabel as="span">Level</FieldLabel>
              <LevelRange>
                <LevelInput>
                  <TextInput
                    aria-label="Minimum level"
                    centered
                    inputMode="numeric"
                    onBlur={() => applyLevels()}
                    onChange={setMinText}
                    value={minText}
                  />
                </LevelInput>
                <Dash aria-hidden="true">–</Dash>
                <LevelInput>
                  <TextInput
                    aria-label="Maximum level"
                    centered
                    inputMode="numeric"
                    onBlur={() => applyLevels()}
                    onChange={setMaxText}
                    value={maxText}
                  />
                </LevelInput>
              </LevelRange>
            </Field>
          </Collapsible>
        </Toolbar>
        <TagsRow $open={filtersOpen} $top={top.length > 0}>
          <TagsLabel as="span">Tags</TagsLabel>
          {top.length ? (
            <TopTags role="group" aria-label="Top tags">
              {top.map(({ tag, count }) => (
                <TopTag
                  key={tag}
                  type="button"
                  aria-pressed={filters.tags.includes(tag)}
                  onClick={() => setFilters({ tags: toggleTag(filters.tags, tag) })}>
                  {filters.tags.includes(tag) ? <Check aria-hidden="true">✓</Check> : null}
                  {tag}
                  <TagCount>
                    {count}
                    <VisuallyHidden>{count === 1 ? ' build' : ' builds'}</VisuallyHidden>
                  </TagCount>
                </TopTag>
              ))}
            </TopTags>
          ) : null}
          <MoreTags $open={filtersOpen}>
            <Chips
              addLabel={top.length ? 'More tags' : 'Add tag'}
              onAdd={(tag) => setFilters({ tags: [...new Set([...filters.tags, tag])] })}
              onRemove={(tag) => setFilters({ tags: filters.tags.filter((t) => t !== tag) })}
              values={filters.tags.filter((tag) => !topNames.has(tag))}
            />
            {filters.search ? <TextButton onClick={clearSearch}>Clear search</TextButton> : null}
            {filtered ? <TextButton onClick={clearFilters}>Clear filters</TextButton> : null}
          </MoreTags>
        </TagsRow>
      </FindFrame>

      <StatusLine>
        <Status aria-live="polite">{builds.isSuccess ? status : ''}</Status>
        {stats && stats.buildCount > 0 ? (
          <Community>
            <b>{stats.buildCount}</b> {stats.buildCount === 1 ? 'build' : 'builds'} by{' '}
            <b>{stats.authorCount}</b> {stats.authorCount === 1 ? 'player' : 'players'}
          </Community>
        ) : null}
      </StatusLine>
      {builds.isPending ? <PageMessage loading /> : null}
      {builds.isError ? (
        <PageMessage title="Couldn’t load builds">
          <ErrorMessage onRetry={() => void builds.refetch()}>
            {errorMessage(builds.error)}
          </ErrorMessage>
        </PageMessage>
      ) : null}
      {builds.isSuccess && shown.length === 0 && !builds.hasNextPage ? (
        <PageMessage title={filtered ? 'No builds match these filters' : 'No builds yet'}>
          {filtered ? (
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <p>Be the first: sign up and create one.</p>
          )}
        </PageMessage>
      ) : null}
      {shown.length > 0 ? <BuildsList builds={shown} authors={authors} /> : null}
      {builds.hasNextPage ? (
        <LoadMore>
          {builds.isFetchingNextPage ? (
            <LoadingAnimation size={30} />
          ) : (
            <Button variant="secondary" onClick={() => void builds.fetchNextPage()}>
              Load more builds
            </Button>
          )}
        </LoadMore>
      ) : null}
      {builds.isFetchNextPageError ? (
        <ErrorMessage onRetry={() => void builds.fetchNextPage()}>
          {errorMessage(builds.error)}
        </ErrorMessage>
      ) : null}
    </>
  );
}

// No hero: the search and filters open the page, under the page's (small) title.
const FindFrame = styled(Frame)`
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
  margin: 0 0 ${SPACE_MD};
`;

const Toolbar = styled.div`
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
`;

const FieldLabel = styled.label`
  ${labelText}
`;

const SearchForm = styled.form`
  display: flex;
  flex: 1 1 280px;
  flex-direction: column;
  gap: 6px;

  @media ${BELOW_MOBILE} {
    flex-basis: 100%;
  }
`;

const SearchField = styled.div`
  position: relative;

  & > input {
    padding-right: 44px;
  }
`;

const SearchSubmit = styled.button`
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

const FiltersToggle = styled(Button)`
  display: none;

  @media ${BELOW_MOBILE} {
    display: inline-flex;
    flex: 1;
  }
`;

// On phones the sort, level and tag filters fold away behind the Filters button.
const Collapsible = styled.div<{ $open: boolean }>`
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;

  @media ${BELOW_MOBILE} {
    display: ${({ $open }) => ($open ? 'flex' : 'none')};
    width: 100%;
  }
`;

const LevelRange = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
`;

const LevelInput = styled.div`
  width: 72px;
`;

const Dash = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;

const Note = styled.p`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  font-size: ${TEXT_SM};
  margin: 0;
  min-height: 44px;
`;

// Desktop: the label, the top tags (T20), the other picked tags and "More tags" wrap as one row.
// Phones: the top tags stay visible as one row that scrolls sideways; the rest folds behind Filters.
const TagsRow = styled.div<{ $open: boolean; $top: boolean }>`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} 8px;
  margin-top: ${SPACE_MD};

  @media ${BELOW_MOBILE} {
    display: ${({ $open, $top }) => ($open || $top ? 'flex' : 'none')};
  }
`;

const TagsLabel = styled(FieldLabel)`
  margin-right: 6px;

  @media ${BELOW_MOBILE} {
    display: none;
  }
`;

const TopTags = styled.div`
  display: contents;

  @media ${BELOW_MOBILE} {
    display: flex;
    gap: 8px;
    margin: 0 -${SPACE_MD};
    overflow-x: auto;
    padding: 4px ${SPACE_MD};
    scrollbar-width: none;
    width: calc(100% + 2 * ${SPACE_MD});
  }
`;

// A toggle chip: 36 px to look like a tag, with a ::after that makes the tap target 44 px.
const TopTag = styled.button`
  align-items: center;
  background: none;
  border: 1px solid ${COLOR_LINE};
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  display: inline-flex;
  flex: none;
  font-size: ${TEXT_SM};
  font-weight: 500;
  gap: 6px;
  min-height: 36px;
  padding: 0 10px;
  position: relative;
  white-space: nowrap;

  &::after {
    content: '';
    inset: -4px 0;
    position: absolute;
  }

  &:hover {
    border-color: ${COLOR_TEXT_MUTED};
    color: ${COLOR_TEXT};
  }

  &[aria-pressed='true'] {
    background: ${COLOR_SURFACE_RAISED};
    border-color: ${COLOR_TEXT_MUTED};
    color: ${COLOR_TEXT};
  }
`;

const Check = styled.span`
  color: ${COLOR_ACCENT};
  font-size: ${TEXT_XS};
`;

const TagCount = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
`;

const MoreTags = styled.div<{ $open: boolean }>`
  display: contents;

  @media ${BELOW_MOBILE} {
    align-items: center;
    display: ${({ $open }) => ($open ? 'flex' : 'none')};
    flex-wrap: wrap;
    gap: ${SPACE_SM} 14px;
    width: 100%;
  }
`;

const StatusLine = styled.div`
  align-items: baseline;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-wrap: wrap;
  font-size: ${TEXT_SM};
  gap: 0 ${SPACE_MD};
  justify-content: space-between;
  margin: ${SPACE_LG} 0 ${SPACE_SM};
`;

const Status = styled.p`
  margin: 0;
`;

const Community = styled.p`
  margin: 0;

  & > b {
    color: ${COLOR_TEXT};
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
`;

const LoadMore = styled.div`
  display: flex;
  justify-content: center;
  margin: ${SPACE_LG} 0;
`;

export default Landing;
