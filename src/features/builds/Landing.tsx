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
import Ornament from '@/components/ui/Ornament';
import PageMessage from '@/components/ui/PageMessage';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TextInput from '@/components/ui/TextInput';
import { TextButton } from '@/components/ui/TextButton';
import { useUserProfiles } from '@/features/profile/queries';
import { MAX_LEVEL } from '@/lib/buildMath';
import { errorMessage, type BuildSort } from '@/lib/firebase';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  TEXT_SM,
  TEXT_XS,
  TRACKING_CAPS,
} from '@/theme';
import BuildsList from './BuildsList';
import {
  clampLevel,
  filterBuilds,
  parseFilters,
  toSearchParams,
  type BuildFilters,
} from './filters';
import PageHero from '@/components/ui/PageHero';
import { useBuilds } from './queries';

const SORTS = [
  { value: 'top', label: 'Most liked' },
  { value: 'new', label: 'Newest' },
] as const satisfies readonly { value: BuildSort; label: string }[];

/**
 * `/`: the current game's builds, most liked or newest first, a page at a time, or a search by name.
 * The first tag filters in Firestore; further tags and the level range filter the loaded builds.
 * Filters live in the URL.
 */
function Landing() {
  const game = useCurrentGame();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const builds = useBuilds({
    sort: filters.sort,
    tag: filters.tags[0],
    search: filters.search || undefined,
  });

  const [searchText, setSearchText] = useState(filters.search);
  const [minText, setMinText] = useState(String(filters.minLevel));
  const [maxText, setMaxText] = useState(String(filters.maxLevel));
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      <PageHero
        title={`${game.name} Builds`}
        tagline="Forge a build, share it, and find the one worth a new playthrough."
      />
      <Ornament />
      <Frame aria-label="Find builds">
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
        <TagsRow $open={filtersOpen}>
          <FieldLabel as="span">Tags</FieldLabel>
          <Chips
            onAdd={(tag) => setFilters({ tags: [...new Set([...filters.tags, tag])] })}
            onRemove={(tag) => setFilters({ tags: filters.tags.filter((t) => t !== tag) })}
            values={filters.tags}
          />
          {filters.search ? <TextButton onClick={clearSearch}>Clear search</TextButton> : null}
          {filtered ? <TextButton onClick={clearFilters}>Clear filters</TextButton> : null}
        </TagsRow>
      </Frame>

      <Status aria-live="polite">{builds.isSuccess ? status : ''}</Status>
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
  color: ${COLOR_ACCENT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_XS};
  font-weight: 600;
  letter-spacing: ${TRACKING_CAPS};
  text-transform: uppercase;
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

const TagsRow = styled.div<{ $open: boolean }>`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} 14px;
  margin-top: ${SPACE_MD};

  @media ${BELOW_MOBILE} {
    display: ${({ $open }) => ($open ? 'flex' : 'none')};
  }
`;

const Status = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 28px 0 12px;
`;

const LoadMore = styled.div`
  display: flex;
  justify-content: center;
  margin: ${SPACE_LG} 0;
`;

export default Landing;
