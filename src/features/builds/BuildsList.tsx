import { Link } from 'react-router';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import Tag from '@/components/ui/Tag';
import Slot from '@/features/editor/Slot';
import {
  SLOT_TYPE_CHEST,
  SLOT_TYPE_GAUNTLET,
  SLOT_TYPE_HELM,
  SLOT_TYPE_LEG,
  SLOT_TYPE_WEAPON,
} from '@/features/editor/slots';
import { getArmor, getWeapon } from '@/data';
import type { Build } from '@/lib/models';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_GOLD,
  COLOR_LIGHTEST_GREEN,
  FONT_DISPLAY,
  BELOW_800,
} from '@/theme';

// The card previews the first two slots of each hand: weapon slots 1, 2 (main) and 4, 5 (off hand).
const PREVIEW_WEAPONS = [
  { index: 0, background: 'weapon' },
  { index: 1, background: 'weapon' },
  { index: 3, background: 'shield' },
  { index: 4, background: 'shield' },
] as const;

const ARMOR = [
  { slot: 'helm', group: 'helms', type: SLOT_TYPE_HELM },
  { slot: 'chest', group: 'chests', type: SLOT_TYPE_CHEST },
  { slot: 'gauntlet', group: 'gauntlets', type: SLOT_TYPE_GAUNTLET },
  { slot: 'leg', group: 'legs', type: SLOT_TYPE_LEG },
] as const;

const likesText = (count: number) => `${count} ${count === 1 ? 'Like' : 'Likes'}`;

/** Build cards (links to the build): likes, name, level, two weapons per hand, armor and tags. */
function BuildsList({ builds }: { builds: Build[] }) {
  return (
    <List>
      {builds.map((build) => {
        const { equipment } = build;
        return (
          <li key={build.id}>
            <Card to={`/build/${build.id}`}>
              <UpperSection>
                <Likes>{likesText(build.likeCount)}</Likes>
                <Name>{build.name}</Name>
                <Level>{`Level ${build.level}`}</Level>
              </UpperSection>
              <LowerSection>
                <EquipmentContainer>
                  {PREVIEW_WEAPONS.map(({ index, background }) => (
                    <Slot
                      key={index}
                      affinity={equipment.weaponAffinities[index] ?? null}
                      background={background}
                      disabled
                      item={getWeapon(equipment.weapons[index]) ?? null}
                      subItem={equipment.weaponSkills[index] ?? null}
                      type={SLOT_TYPE_WEAPON}
                    />
                  ))}
                </EquipmentContainer>
                <GearContainer>
                  {ARMOR.map(({ slot, group, type }) => (
                    <Slot
                      key={slot}
                      background={slot}
                      disabled
                      item={getArmor(group, equipment[slot]) ?? null}
                      type={type}
                    />
                  ))}
                </GearContainer>
              </LowerSection>
              {build.tags.length ? (
                <TagsSection>
                  {build.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </TagsSection>
              ) : null}
            </Card>
          </li>
        );
      })}
    </List>
  );
}

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
`;

const Card = styled(Link)`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 4px;
  color: ${COLOR_GOLD};
  display: flex;
  flex-direction: column;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 25px;
  padding: 0 10px;
  transition: background-color 0.1s ease-in-out;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
    color: ${COLOR_LIGHTEST_GREEN};
  }

  &:focus-visible {
    outline: 2px solid ${COLOR_GOLD};
  }
`;

const LowerSection = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 0;
  margin: 10px 0;
`;

const EquipmentContainer = styled(FlexGroup)`
  border-right: 1px solid ${COLOR_LIGHT_GREEN};
  gap: 20px;
  padding-right: 20px;

  @media ${BELOW_800} {
    border-right: none;
    gap: 8px;
    padding-right: 0;
  }
`;

const GearContainer = styled(FlexGroup)`
  gap: 20px;
  padding-left: 20px;

  @media ${BELOW_800} {
    gap: 8px;
    padding-left: 0;
  }
`;

const UpperSection = styled(FlexGroup)`
  align-items: center;
  justify-content: space-between;
  padding: 10px 0px;
  width: 100%;
  border-bottom: 1px solid ${COLOR_LIGHT_GREEN};
`;

const Level = styled.span`
  text-align: right;
  width: 25%;
`;

const Likes = styled.span`
  width: 25%;
`;

const Name = styled.span`
  color: ${COLOR_LIGHTEST_GREEN};
  font-family: ${FONT_DISPLAY};
  font-size: 20px;
  overflow-wrap: anywhere;
  text-align: center;
  text-shadow: 0px 0px 3px ${COLOR_GOLD};
  width: 50%;
`;

const TagsSection = styled(FlexGroup)`
  border-top: 1px solid ${COLOR_LIGHT_GREEN};
  flex-wrap: wrap;
  gap: 8px 0;
  justify-content: center;
  padding: 10px 0;
`;

export default BuildsList;
