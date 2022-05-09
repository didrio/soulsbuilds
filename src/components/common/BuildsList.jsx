import styled from 'styled-components';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import FlexGroup from './FlexGroup';
import Slot from './Slot';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_GOLD,
  COLOR_LIGHTEST_GREEN,
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
      {builds.filter(({ name }) => name).map((build) => (
        <Build
          key={build.name}
          onClick={handleSelectBuild(build.id)}
          vertical
        >
          <UpperSection>
            <LikesContainer>
              {`${build.likes} ${build.likes === 1 ? 'Like' : 'Likes'}`}
            </LikesContainer>
            <NameContainer>
              {build.name}
            </NameContainer>
            <LevelContainer>
              {`Level ${build.level}`}
            </LevelContainer>
          </UpperSection>
          <LowerSection>
            <EquipmentContainer>
              <Slot
                background="weapon"
                disabled
                item={weaponsAndShields[build?.weapons?.[0]] || null}
                subItem={build?.weaponSkills?.[0] || null}
                type={SLOT_TYPE_WEAPON}
              />
              <Slot
                background="weapon"
                disabled
                item={weaponsAndShields[build?.weapons?.[1]] || null}
                subItem={build?.weaponSkills?.[1] || null}
                type={SLOT_TYPE_WEAPON}
              />
              <Slot
                background="shield"
                disabled
                item={weaponsAndShields[build?.weapons?.[3]] || null}
                subItem={build?.weaponSkills?.[3] || null}
                type={SLOT_TYPE_WEAPON}
              />
              <Slot
                background="shield"
                disabled
                item={weaponsAndShields[build?.weapons?.[4]] || null}
                subItem={build?.weaponSkills?.[4] || null}
                type={SLOT_TYPE_WEAPON}
              />
            </EquipmentContainer>
            <GearContainer>
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
            </GearContainer>
          </LowerSection>
          {build.tags.length ? (
            <TagsSection>
              {build.tags.map((tag) => (
                <Tag
                  key={tag}
                >
                  {tag}
                </Tag>
              ))}
            </TagsSection>
          ) : null}
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
  margin-bottom: 25px;
  transition: background-color .1s ease-in-out;
  border: 1px solid ${COLOR_LIGHT_GREEN};

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

const LowerSection = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  height: 80px;
  margin: 10px 0;
`;

const EquipmentContainer = styled(FlexGroup)`
  border-right: 1px solid ${COLOR_LIGHT_GREEN};

  & > div {
    margin-right: 20px;
  }
`;

const GearContainer = styled(FlexGroup)`
  & > div {
    margin-left: 20px;
  }
`;

const UpperSection = styled(FlexGroup)`
  align-items: center;
  justify-content: space-between;
  padding: 10px 0px;
  width: 100%;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid ${COLOR_LIGHT_GREEN};
`;

const LevelContainer = styled(FlexGroup)`
  width: 25%;
  justify-content: flex-end;
`;

const LikesContainer = styled(FlexGroup)`
  width: 25%;
  justify-content: flex-start;
`;

const NameContainer = styled(FlexGroup)`
  width: 50%;
  justify-content: center;
  font-size: 20px;
  font-family: "OptimusPrincepsSemiBold", serif;
  text-shadow: 0px 0px 3px ${COLOR_GOLD};
  color: ${COLOR_LIGHTEST_GREEN};
`;

const TagsSection = styled(FlexGroup)`
  justify-content: center;
  padding: 10px 0;
  border-top: 1px solid ${COLOR_LIGHT_GREEN};
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

BuildsList.propTypes = {
  builds: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)),
};

BuildsList.defaultProps = {
  builds: [],
};

export default BuildsList;
