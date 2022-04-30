import styled from 'styled-components';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import FlexGroup from './FlexGroup';
import Slot from './Slot';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  SLOT_TYPE_WEAPON,
} from '../../constants';
import weaponsAndShields from '../../data/weaponsAndShields.json';
import armorData from '../../data/armorIndexed.json';

function BuildsList({ builds }) {
  const navigate = useNavigate();

  const handleSelectBuild = (id) => () => {
    navigate(`/build/${id}`);
  };

  return (
    <Container
      vertical
    >
      {builds.map((build) => (
        <Build
          key={build.name}
          onClick={handleSelectBuild(build.id)}
          vertical
        >
          <UpperSection>
            <NameContainer>
              <FlexGroup>
                {build.name}
              </FlexGroup>
              <TagsContainer>
                {build.tags.map((tag) => (
                  <Tag
                    key={tag}
                  >
                    {tag}
                  </Tag>
                ))}
              </TagsContainer>
            </NameContainer>
            <DetailsContainer>
              <LevelContainer>
                {`Level ${build.level}`}
              </LevelContainer>
              <Chip>
                {`${build.likes} ${build.likes === 1 ? 'Like' : 'Likes'}`}
              </Chip>
            </DetailsContainer>
          </UpperSection>
          <LowerSection>
            <Slot
              background="weapon"
              disabled
              item={weaponsAndShields[build?.weapons?.[0]] || null}
              type={SLOT_TYPE_WEAPON}
            />
            <Slot
              background="weapon"
              disabled
              item={weaponsAndShields[build?.weapons?.[1]] || null}
              type={SLOT_TYPE_WEAPON}
            />
            <Slot
              background="shield"
              disabled
              item={weaponsAndShields[build?.weapons?.[3]] || null}
              type={SLOT_TYPE_WEAPON}
            />
            <Slot
              background="shield"
              disabled
              item={weaponsAndShields[build?.weapons?.[4]] || null}
              type={SLOT_TYPE_WEAPON}
            />
            <Slot
              background="helm"
              disabled
              item={armorData.helms[build?.helm] || null}
              type={SLOT_TYPE_WEAPON}
            />
            <Slot
              background="chest"
              disabled
              item={armorData.chests[build?.chest] || null}
              type={SLOT_TYPE_WEAPON}
            />
            <Slot
              background="gauntlet"
              disabled
              item={armorData.gauntlets[build?.gauntlet] || null}
              type={SLOT_TYPE_WEAPON}
            />
            <Slot
              background="leg"
              disabled
              item={armorData.legs[build?.leg] || null}
              type={SLOT_TYPE_WEAPON}
            />
          </LowerSection>
        </Build>
      ))}
    </Container>
  );
}

const Container = styled(FlexGroup)`
  width: 100%;
`;

const Build = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  width: 100%;
  cursor: pointer;
  padding: 0 10px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 15px;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

const UpperSection = styled(FlexGroup)`
  align-items: center;
  justify-content: space-between;
  height: 50px;
  border-bottom: 1px solid ${COLOR_LIGHT_GREEN};
`;

const LowerSection = styled(FlexGroup)`
  align-items: center;
  height: 80px;
  margin: 10px 0;

  & > div {
    margin-right: 10px;
  }
`;

const Chip = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  align-items: center;
  justify-content: center;
  height: 30px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  cursor: pointer;
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 14px;
`;

const DetailsContainer = styled(FlexGroup)`
  align-items: center;
`;

const LevelContainer = styled(FlexGroup)`
  font-size: 16px;
  margin-right: 20px;
  margin-bottom: -3px;
`;

const TagsContainer = styled(FlexGroup)`
  margin-left: 20px;
`;

const Tag = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  height: 30px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 14px;
`;

const NameContainer = styled(FlexGroup)`
  align-items: center;
`;

BuildsList.propTypes = {
  builds: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)),
};

BuildsList.defaultProps = {
  builds: [],
};

export default BuildsList;
