import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { COLOR_LIGHTEST_GREEN } from '@/theme';
import Slot from '../Slot';
import { SLOT_TYPE_TEAR, TEAR_SLOTS, type TearSlot } from '../slots';
import { selectTearSlots } from '../store/selectors';
import { updateTear } from '../store/tears';

/** Flask of Wondrous Physick section: two crystal tear slots. */
function TearEditor({ editable }: { editable: boolean }) {
  const dispatch = useAppDispatch();
  const tears = useAppSelector(selectTearSlots);

  const handleRemoveTear = (id: TearSlot) => () => {
    dispatch(updateTear({ id, item: null }));
  };

  return (
    <Container vertical>
      <HeaderContainer>
        <Header>Flask of Wondrous Physick</Header>
      </HeaderContainer>
      <SlotContainer>
        {TEAR_SLOTS.map((id) => (
          <Slot
            disabled={!editable}
            id={id}
            item={tears[id]}
            key={id}
            onRemove={handleRemoveTear(id)}
            type={SLOT_TYPE_TEAR}
          />
        ))}
      </SlotContainer>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  width: 100%;
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

const SlotContainer = styled(FlexGroup)`
  justify-content: center;

  & > div {
    margin-right: 10px;
  }
`;

export default TearEditor;
