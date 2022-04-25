import { useEffect, useState, useMemo } from 'react';
import compact from 'lodash/compact';
import sortBy from 'lodash/sortBy';
import styled from 'styled-components';
import FlexGroup from './common/FlexGroup';
import TextInput from './common/TextInput';
import Chips from './common/Chips';
import BuildsList from './common/BuildsList';
import { getBuilds } from '../firebase';
import { COLOR_LIGHT_GREEN } from '../constants';

const MAX_LEVEL = 713;

const containsAll = (arr1, arr2) => arr1.every((element) => arr2.includes(element));

function Landing() {
  const [builds, setBuilds] = useState([]);
  const [tags, setTags] = useState([]);
  const [levelRange, setLevelRange] = useState([0, MAX_LEVEL]);

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
    let newValue = Number(value);
    if (Number.isNaN(newValue)) {
      newValue = 0;
    }
    newValue = newValue < 0 ? 0 : newValue;
    setLevelRange((prevState) => ([Math.min(newValue, prevState[1]), prevState[1]]));
  };

  const handleChangeMaxRange = (value) => {
    let newValue = Number(value);
    if (Number.isNaN(newValue)) {
      newValue = MAX_LEVEL;
    }
    newValue = newValue < 0 ? 0 : newValue;
    newValue = newValue > MAX_LEVEL ? MAX_LEVEL : newValue;
    setLevelRange((prevState) => ([prevState[0], Math.max(newValue, prevState[0])]));
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
    <FlexGroup
      vertical
    >
      <Filters>
        <TagContainer
          vertical
        >
          <SubHeader>
            Tags
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
            Level Range
          </SubHeader>
          <LevelRange>
            <FlexGroup>
              Min:
            </FlexGroup>
            <LevelRangeInput>
              <TextInput
                centered
                onChange={handleChangeMinRange}
                value={levelRange[0]}
              />
            </LevelRangeInput>
            <FlexGroup>
              Max:
            </FlexGroup>
            <LevelRangeInput>
              <TextInput
                centered
                onChange={handleChangeMaxRange}
                value={levelRange[1]}
              />
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
    </FlexGroup>
  );
}

const SubHeader = styled(FlexGroup)`
  font-weight: bold;
  font-size: 20px;
`;

const Filters = styled(FlexGroup)`
  border-bottom: 1px solid ${COLOR_LIGHT_GREEN};
  width: 100%;
  justify-content: space-between;
  padding-bottom: 15px;
  margin-bottom: 15px;
`;

const Results = styled(FlexGroup)`
  margin-top: 10px;
  padding: 20px;
  width: 100%;
`;

const TagContainer = styled(FlexGroup)`
  
`;

const LevelRangeContainer = styled(FlexGroup)`

`;

const LevelRange = styled(FlexGroup)`
  align-items: center;
  margin-top: 10px;
  margin-bottom: 20px;
`;

const LevelRangeInput = styled(FlexGroup)`
  margin-left: 10px;
  margin-right: 10px;
  max-width: 60px;
  width: 60px;
`;

export default Landing;
