import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import {
  COLOR_GRAY,
  COLOR_LIGHTER_GRAY,
  SLOT_TYPES,
} from '../../constants';
import { updateEditSlot, updateSlotType } from '../../store/app';
import FlexGroup from './FlexGroup';

function Slot({
  background,
  disabled,
  id,
  item,
  type,
}) {
  const dispatch = useDispatch();

  const handleClick = () => {
    if (!disabled) {
      dispatch(updateEditSlot(id));
      dispatch(updateSlotType(type));
    }
  };

  const hasItem = item !== null;

  return (
    <Container
      background={background}
      disabled={disabled}
      onClick={handleClick}
    >
      {!hasItem ? null : (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={`/assets/${item.imageUrl}`}
        />
      )}
      {!hasItem ? null : (
        <NameContainer>
          {item.name}
        </NameContainer>
      )}
    </Container>
  );
}

const Container = styled(FlexGroup)`
  justify-content: center;
  background-color: ${COLOR_GRAY};
  border-radius: 2px;
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
  height: 120px;
  width: 120px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    background-image: url("/assets/menu/${({ background }) => background}.png");
    background-size: auto 80%;
    background-repeat: no-repeat;
    background-position: center;
    opacity: .4;
  }

  &:hover {
    background-color: ${({ disabled }) => (disabled ? COLOR_GRAY : COLOR_LIGHTER_GRAY)};
  }

  & > img {
    height: 100%;
    width: 100%;
  }
`;

const NameContainer = styled.div`
  position: absolute;
  bottom: 5px;
  font-weight: bold;
  font-size: 12px;
  text-align: center;
  text-shadow: 0px 0px 5px rgba(0,0,0,1);
`;

Slot.propTypes = {
  background: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  item: PropTypes.objectOf(PropTypes.string),
  type: PropTypes.oneOf(SLOT_TYPES).isRequired,
};

Slot.defaultProps = {
  background: '',
  disabled: false,
  item: null,
};

export default Slot;
