import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Chips from '@/components/ui/Chips';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FlexGroup from '@/components/ui/FlexGroup';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import PageMessage from '@/components/ui/PageMessage';
import TextInput from '@/components/ui/TextInput';
import { MAX_LEVEL } from '@/lib/buildMath';
import { errorMessage, type BuildSort } from '@/lib/firebase';
import { COLOR_GOLD, COLOR_GREEN, COLOR_LIGHT_GREEN, BELOW_800 } from '@/theme';
import BuildsList from './BuildsList';
import {
  clampLevel,
  filterBuilds,
  parseFilters,
  toSearchParams,
  type BuildFilters,
} from './filters';
import { useBuilds } from './queries';

/**
 * `/`: Elden Ring builds, most liked or newest first, a page at a time. The first tag filters in
 * Firestore; further tags and the level range filter the loaded builds. Filters live in the URL.
 */
function Landing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const builds = useBuilds({ sort: filters.sort, tag: filters.tags[0] });

  const [minText, setMinText] = useState(String(filters.minLevel));
  const [maxText, setMaxText] = useState(String(filters.maxLevel));

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

  const loaded = builds.data?.pages.flatMap((page) => page.builds) ?? [];
  const shown = filterBuilds(loaded, filters);
  const filtered = toSearchParams({ ...filters, sort: 'top' }).size > 0;

  return (
    <Container vertical>
      <Filters>
        <FilterGroup>
          <SubHeader>Sort</SubHeader>
          <SortToggle role="group" aria-label="Sort builds">
            {(['top', 'new'] as BuildSort[]).map((sort) => (
              <SortButton
                key={sort}
                type="button"
                aria-pressed={filters.sort === sort}
                $active={filters.sort === sort}
                onClick={() => setFilters({ sort })}>
                {sort === 'top' ? 'Most liked' : 'Newest'}
              </SortButton>
            ))}
          </SortToggle>
        </FilterGroup>
        <FilterGroup>
          <SubHeader>Filter by Tags</SubHeader>
          <Chips
            onAdd={(tag) => setFilters({ tags: [...new Set([...filters.tags, tag])] })}
            onRemove={(tag) => setFilters({ tags: filters.tags.filter((t) => t !== tag) })}
            values={filters.tags}
          />
        </FilterGroup>
        <FilterGroup as="form" onSubmit={applyLevels} aria-label="Level range">
          <SubHeader>Filter by Level Range</SubHeader>
          <LevelRangeRow>
            <LevelRangeInput>
              <TextInput
                aria-label="Minimum level"
                centered
                inputMode="numeric"
                onBlur={() => applyLevels()}
                onChange={setMinText}
                value={minText}
              />
            </LevelRangeInput>
            <span aria-hidden="true">–</span>
            <LevelRangeInput>
              <TextInput
                aria-label="Maximum level"
                centered
                inputMode="numeric"
                onBlur={() => applyLevels()}
                onChange={setMaxText}
                value={maxText}
              />
            </LevelRangeInput>
          </LevelRangeRow>
        </FilterGroup>
      </Filters>
      <Results vertical>
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
              <Button
                onClick={() => {
                  setMinText('1');
                  setMaxText(String(MAX_LEVEL));
                  setFilters({ tags: [], minLevel: 1, maxLevel: MAX_LEVEL });
                }}>
                Clear filters
              </Button>
            ) : (
              <p>Be the first: register and create one.</p>
            )}
          </PageMessage>
        ) : null}
        {shown.length > 0 ? <BuildsList builds={shown} /> : null}
        {builds.hasNextPage ? (
          <LoadMore>
            {builds.isFetchingNextPage ? (
              <LoadingAnimation size={30} />
            ) : (
              <Button onClick={() => void builds.fetchNextPage()}>Load more</Button>
            )}
          </LoadMore>
        ) : null}
        {builds.isFetchNextPageError ? (
          <ErrorMessage onRetry={() => void builds.fetchNextPage()}>
            {errorMessage(builds.error)}
          </ErrorMessage>
        ) : null}
      </Results>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const SubHeader = styled.h2`
  font-size: 20px;
  font-weight: normal;
  margin: 0 0 10px;
`;

const Filters = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
  margin-bottom: 15px;
  width: 95%;

  @media ${BELOW_800} {
    flex-direction: column;
    align-items: center;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;

  @media ${BELOW_800} {
    align-items: center;
  }
`;

const SortToggle = styled.div`
  display: flex;
`;

const SortButton = styled.button<{ $active: boolean }>`
  background-color: ${({ $active }) => ($active ? COLOR_LIGHT_GREEN : COLOR_GREEN)};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  color: ${COLOR_GOLD};
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  height: 40px;
  padding: 0 14px;

  &:focus-visible {
    outline: 2px solid ${COLOR_GOLD};
  }
`;

const Results = styled(FlexGroup)`
  margin-top: 10px;
  width: 95%;
`;

const LevelRangeRow = styled(FlexGroup)`
  align-items: center;
  gap: 10px;
`;

const LevelRangeInput = styled(FlexGroup)`
  width: 60px;
`;

const LoadMore = styled(FlexGroup)`
  justify-content: center;
  margin: 10px 0 20px;
`;

export default Landing;
