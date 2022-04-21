import { useSelector } from 'react-redux';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import FlexGroup from './common/FlexGroup';
import Slot from './common/Slot';
import { SLOT_TYPE_TEAR } from '../constants';
import { selectTear1, selectTear2 } from '../store/selectors';

function TearEditor({ editable }) {
  const tear1 = useSelector(selectTear1);
  const tear2 = useSelector(selectTear2);

  return (
    <FlexGroup
      vertical
    >
      <Header>
        Flask of Wondrous Physick
      </Header>
      <SlotContainer>
        <Slot
          disabled={!editable}
          id="tear1"
          item={tear1}
          type={SLOT_TYPE_TEAR}
        />
        <Slot
          disabled={!editable}
          id="tear2"
          item={tear2}
          type={SLOT_TYPE_TEAR}
        />
      </SlotContainer>
    </FlexGroup>
  );
}

const Header = styled.h2`

`;

const SlotContainer = styled(FlexGroup)`
  & > div {
    margin-right: 10px;
  }
`;

TearEditor.propTypes = {
  editable: PropTypes.bool.isRequired,
};

export default TearEditor;
