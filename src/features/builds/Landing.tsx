import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import OutsideClickHandler from '@/components/ui/OutsideClickHandler';
import FlexGroup from '@/components/ui/FlexGroup';
import TextInput from '@/components/ui/TextInput';
import Chips from '@/components/ui/Chips';
import { compact, sortBy } from '@/lib/array';
import { getBuilds } from '@/lib/firebase';
import type { Build } from '@/lib/models';
import BuildsList from './BuildsList';

const MAX_LEVEL = 713;

/** The level range inputs hold raw text until they're clamped on an outside click. */
type LevelRange = [number | string, number | string];

const containsAll = (arr1: string[], arr2: string[]) =>
  arr1.every((element) => arr2.includes(element));

/** `/`: every build, filtered by tags and level range client-side, most liked first. */
function Landing() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [levelRange, setLevelRange] = useState<LevelRange>([1, MAX_LEVEL]);

  useEffect(() => {
    const run = async () => {
      const result = await getBuilds();
      setBuilds(result);
    };
    run();
  }, []);

  const handleAddTag = (tag: string) => {
    setTags((prevState) => compact([...prevState, tag]));
  };

  const handleRemoveTag = (value: string) => {
    setTags((prevState) => prevState.filter((tag) => tag !== value));
  };

  const handleChangeMinRange = (value: string) => {
    setLevelRange((prevState) => [value, prevState[1]]);
  };

  const handleChangeMaxRange = (value: string) => {
    setLevelRange((prevState) => [prevState[0], value]);
  };

  const handleRangeClickOutside = () => {
    setLevelRange((prevState) => {
      let min = Number(prevState[0]);
      let max = Number(prevState[1]);
      if (Number.isNaN(min) || min < 1 || min > MAX_LEVEL) {
        min = 1;
      }
      if (Number.isNaN(max) || max < 1 || max > MAX_LEVEL) {
        max = MAX_LEVEL;
      }
      if (min > max) {
        min = max;
      }
      if (max < min) {
        max = min;
      }
      return [min, max];
    });
  };

  const buildResults = useMemo(() => {
    // Comparing against the raw range text relies on JS coercion, as in 2022.
    const [min, max] = levelRange as [number, number];
    let filteredBuilds = builds.filter(
      (build) => Number(build.level) >= min && Number(build.level) <= max,
    );
    // Starts again from `builds`, dropping the level filter (T5).
    if (tags.length > 0) {
      filteredBuilds = builds.filter((build) => containsAll(tags, build.tags));
    }
    filteredBuilds = sortBy(filteredBuilds, ({ likes = 0 }) => likes * -1);
    return filteredBuilds;
  }, [builds, tags, levelRange]);

  return (
    <Container vertical>
      <Filters>
        <TagContainer vertical>
          <SubHeader>Filter by Tags</SubHeader>
          <FlexGroup>
            <Chips onAdd={handleAddTag} onRemove={handleRemoveTag} values={tags} />
          </FlexGroup>
        </TagContainer>
        <LevelRangeContainer vertical>
          <SubHeader>Filter by Level Range</SubHeader>
          <LevelRangeRow>
            <LevelRangeInput>
              <OutsideClickHandler onOutsideClick={handleRangeClickOutside}>
                <TextInput centered onChange={handleChangeMinRange} value={levelRange[0]} />
              </OutsideClickHandler>
            </LevelRangeInput>
            <LevelSpacer>-</LevelSpacer>
            <LevelRangeInput>
              <OutsideClickHandler onOutsideClick={handleRangeClickOutside}>
                <TextInput centered onChange={handleChangeMaxRange} value={levelRange[1]} />
              </OutsideClickHandler>
            </LevelRangeInput>
          </LevelRangeRow>
        </LevelRangeContainer>
      </Filters>
      <Results vertical>
        <BuildsList builds={buildResults} />
      </Results>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const SubHeader = styled(FlexGroup)`
  font-size: 20px;
`;

const Filters = styled(FlexGroup)`
  justify-content: space-between;
  margin-bottom: 15px;
  align-items: center;
  width: 95%;
`;

const Results = styled(FlexGroup)`
  margin-top: 10px;
  width: 100%;
  width: 95%;
`;

const TagContainer = styled(FlexGroup)``;

const LevelRangeContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
`;

const LevelRangeRow = styled(FlexGroup)`
  align-items: center;
  margin-top: 10px;
`;

const LevelRangeInput = styled(FlexGroup)`
  max-width: 60px;
  width: 60px;
`;

const LevelSpacer = styled(FlexGroup)`
  margin: 0 10px;
`;

export default Landing;
