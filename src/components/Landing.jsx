import { useEffect, useState, useMemo } from 'react';
import compact from 'lodash/compact';
import sortBy from 'lodash/sortBy';
import styled from 'styled-components';
import OutsideClickHandler from 'react-outside-click-handler';
import FlexGroup from './common/FlexGroup';
import TextInput from './common/TextInput';
import Chips from './common/Chips';
import BuildsList from './common/BuildsList';
import { getBuilds } from '../firebase';

const MAX_LEVEL = 713;

const containsAll = (arr1, arr2) => arr1.every((element) => arr2.includes(element));

function Landing() {
  const [builds, setBuilds] = useState([]);
  const [tags, setTags] = useState([]);
  const [levelRange, setLevelRange] = useState([1, MAX_LEVEL]);

  useEffect(() => {
    const run = async () => {
      const result = await getBuilds();
      setBuilds(result);
    };
    run();
  }, []);

  const handleAddTag = (tag) => {
    setTags((prevState) => (
      compact([...prevState, tag])
    ));
  };

  const handleRemoveTag = (value) => {
    setTags((prevState) => prevState.filter((tag) => tag !== value));
  };

  const handleChangeMinRange = (value) => {
    setLevelRange((prevState) => ([value, prevState[1]]));
  };

  const handleChangeMaxRange = (value) => {
    setLevelRange((prevState) => ([prevState[0], value]));
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
    let filteredBuilds = builds
      .filter((build) => (
        Number(build.level) >= levelRange[0] && Number(build.level) <= levelRange[1]
      ));
    if (tags.length > 0) {
      filteredBuilds = builds
        .filter((build) => containsAll(tags, build.tags));
    }
    filteredBuilds = sortBy(filteredBuilds, ({ likes = 0 }) => likes * -1);
    return filteredBuilds;
  }, [builds, tags, levelRange]);

  return (
    <Container
      vertical
    >
      <Filters>
        <TagContainer
          vertical
        >
          <SubHeader>
            Filter by Tags
          </SubHeader>
          <FlexGroup>
            <Chips
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              values={tags}
            />
          </FlexGroup>
        </TagContainer>
        <LevelRangeContainer
          vertical
        >
          <SubHeader>
            Filter by Level Range
          </SubHeader>
          <LevelRange>
            <LevelRangeInput>
              <OutsideClickHandler
                onOutsideClick={handleRangeClickOutside}
              >
                <TextInput
                  centered
                  onChange={handleChangeMinRange}
                  value={levelRange[0]}
                />
              </OutsideClickHandler>
            </LevelRangeInput>
            <LevelSpacer>
              -
            </LevelSpacer>
            <LevelRangeInput>
              <OutsideClickHandler
                onOutsideClick={handleRangeClickOutside}
              >
                <TextInput
                  centered
                  onChange={handleChangeMaxRange}
                  value={levelRange[1]}
                />
              </OutsideClickHandler>
            </LevelRangeInput>
          </LevelRange>
        </LevelRangeContainer>
      </Filters>
      <Results
        vertical
      >
        <BuildsList
          builds={buildResults}
        />
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
  font-weight: bold;
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

const TagContainer = styled(FlexGroup)`
  
`;

const LevelRangeContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
`;

const LevelRange = styled(FlexGroup)`
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
