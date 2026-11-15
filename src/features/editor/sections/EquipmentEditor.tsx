import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { COLOR_LIGHTEST_GREEN } from '@/theme';
import Slot from '../Slot';
import {
  SLOT_TYPE_ARROW,
  SLOT_TYPE_CHEST,
  SLOT_TYPE_GAUNTLET,
  SLOT_TYPE_HELM,
  SLOT_TYPE_LEG,
  SLOT_TYPE_TAL,
  SLOT_TYPE_WEAPON,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
  type ArrowSlot,
  type TalismanSlot,
  type WeaponSlot,
} from '../slots';
import { selectEquipment } from '../store/selectors';
import {
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateArrow,
  updateTal,
  updateWeapon,
  updateWeaponAffinity,
  updateWeaponSkill,
} from '../store/equipment';

// Consumables have state and a picker but no UI (commented out in 2022; T6 decides).

/** Weapon slot n (1–6) and the affinity/skill slots that belong to it. */
const weaponSlotIds = (index: number) => ({
  id: WEAPON_SLOTS[index] as WeaponSlot,
  affinityId: WEAPON_AFFINITY_SLOTS[index]!,
  subId: WEAPON_SKILL_SLOTS[index]!,
});

/** Equipment section: main hand, off hand, gear (armor) and talisman slots. */
function EquipmentEditor({ editable }: { editable: boolean }) {
  const dispatch = useAppDispatch();
  const equipment = useAppSelector(selectEquipment);

  const handleRemoveArrow = (id: ArrowSlot) => () => {
    dispatch(updateArrow({ id, item: null }));
  };

  const handleRemoveTal = (id: TalismanSlot) => () => {
    dispatch(updateTal({ id, item: null }));
  };

  const handleRemoveWeapon = (index: number) => () => {
    const { id, affinityId, subId } = weaponSlotIds(index);
    dispatch(updateWeapon({ id, item: null }));
    dispatch(updateWeaponAffinity({ id: affinityId, item: null }));
    dispatch(updateWeaponSkill({ id: subId, item: null }));
  };

  const handleRemoveHelm = () => {
    dispatch(updateHelm(null));
  };

  const handleRemoveChest = () => {
    dispatch(updateChest(null));
  };

  const handleRemoveGauntlet = () => {
    dispatch(updateGauntlet(null));
  };

  const handleRemoveLeg = () => {
    dispatch(updateLeg(null));
  };

  const weaponSlot = (index: number, background: string) => {
    const ids = weaponSlotIds(index);
    return (
      <Slot
        affinityId={ids.affinityId}
        background={background}
        disabled={!editable}
        id={ids.id}
        item={equipment[ids.id]}
        key={ids.id}
        onRemove={handleRemoveWeapon(index)}
        subId={ids.subId}
        type={SLOT_TYPE_WEAPON}
      />
    );
  };

  const arrowSlot = (id: ArrowSlot, background: string) => (
    <Slot
      background={background}
      disabled={!editable}
      id={id}
      item={equipment[id]}
      key={id}
      onRemove={handleRemoveArrow(id)}
      type={SLOT_TYPE_ARROW}
    />
  );

  const talismanSlot = (id: TalismanSlot) => (
    <Slot
      background="talisman"
      disabled={!editable}
      id={id}
      item={equipment[id]}
      key={id}
      onRemove={handleRemoveTal(id)}
      type={SLOT_TYPE_TAL}
    />
  );

  return (
    <Container vertical>
      <HeaderContainer>
        <Header>Equipment</Header>
      </HeaderContainer>
      <HeaderContainer>
        <SubHeader>Main Hand</SubHeader>
      </HeaderContainer>
      <SlotContainer>
        {weaponSlot(0, 'weapon')}
        {weaponSlot(1, 'weapon')}
        {weaponSlot(2, 'weapon')}
        {arrowSlot('arrow1', 'arrow')}
        {arrowSlot('arrow2', 'arrow')}
      </SlotContainer>
      <HeaderContainer>
        <SubHeader>Off Hand</SubHeader>
      </HeaderContainer>
      <SlotContainer>
        {weaponSlot(3, 'shield')}
        {weaponSlot(4, 'shield')}
        {weaponSlot(5, 'shield')}
        {arrowSlot('arrow3', 'bolt')}
        {arrowSlot('arrow4', 'bolt')}
      </SlotContainer>
      <HeaderContainer>
        <SubHeader>Gear</SubHeader>
      </HeaderContainer>
      <SlotContainer>
        <Slot
          background="helm"
          disabled={!editable}
          id="helm"
          item={equipment.helm}
          onRemove={handleRemoveHelm}
          type={SLOT_TYPE_HELM}
        />
        <Slot
          background="chest"
          disabled={!editable}
          id="chest"
          item={equipment.chest}
          onRemove={handleRemoveChest}
          type={SLOT_TYPE_CHEST}
        />
        <Slot
          background="gauntlet"
          disabled={!editable}
          id="gauntlet"
          item={equipment.gauntlet}
          onRemove={handleRemoveGauntlet}
          type={SLOT_TYPE_GAUNTLET}
        />
        <Slot
          background="leg"
          disabled={!editable}
          id="leg"
          item={equipment.leg}
          onRemove={handleRemoveLeg}
          type={SLOT_TYPE_LEG}
        />
      </SlotContainer>
      <HeaderContainer>
        <SubHeader>Talismans</SubHeader>
      </HeaderContainer>
      <SlotContainer>
        {talismanSlot('tal1')}
        {talismanSlot('tal2')}
        {talismanSlot('tal3')}
        {talismanSlot('tal4')}
      </SlotContainer>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  justify-content: center;
`;

const HeaderContainer = styled(FlexGroup)`
  justify-content: center;
`;

const Header = styled.h2`
  color: ${COLOR_LIGHTEST_GREEN};
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: normal;
`;

const SubHeader = styled.h3`
  margin-bottom: 20px;
  font-weight: normal;
`;

const SlotContainer = styled(FlexGroup)`
  justify-content: center;
  flex-wrap: wrap;

  & > div {
    margin-bottom: 10px;
    margin-right: 10px;
  }
`;

export default EquipmentEditor;
