import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import noop from 'lodash/noop';
import {
  COLOR_LIGHT_GOLD,
  COLOR_DARK_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  SLOT_TYPES,
} from '../../constants';
import { updateEditSlot, updateSlotType } from '../../store/app';
import FlexGroup from './FlexGroup';

const SLOT_SIZE = '80px';
const SLOT_SIZE_SMALL = '60px';
const SLOT_SIZE_XSMALL = '50px';
const SLOT_SIZE_XXSMALL = '40px';

function Slot({
  background,
  disabled,
  id,
  item,
  onRemove,
  size,
  type,
}) {
  const dispatch = useDispatch();

  const hasItem = item !== null;
  const backgroundColor = hasItem ? COLOR_DARK_GOLD : COLOR_GREEN;
  const hoverColor = hasItem ? COLOR_LIGHT_GOLD : COLOR_LIGHT_GREEN;

  const handleClick = () => {
    if (!disabled && !hasItem) {
      dispatch(updateEditSlot(id));
      dispatch(updateSlotType(type));
    } else if (!disabled && hasItem) {
      onRemove();
    }
  };

  return (
    <Container
      background={background}
      backgroundColor={backgroundColor}
      disabled={disabled}
      hasItem={hasItem}
      hoverColor={hoverColor}
      onClick={handleClick}
      size={size}
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
  align-items: center;
  justify-content: center;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: 2px;
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
  height: ${({ size }) => (size === null ? SLOT_SIZE : size)};
  width: ${({ size }) => (size === null ? SLOT_SIZE : size)};
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    background-image: ${({ background, hasItem }) => (hasItem ? 'none' : `url("/assets/menu/${background}.png")`)};
    background-size: auto 80%;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 1;
    box-shadow: 0px 0px 3px ${COLOR_GREEN};
  }

  &:hover {
    background-color: ${({ backgroundColor, disabled, hoverColor }) => (disabled ? backgroundColor : hoverColor)};
  }

  & > img {
    height: 85%;
    width: 85%;
  }

  @media only screen and (max-width: 1400px) {
    height: ${SLOT_SIZE_SMALL};
    width: ${SLOT_SIZE_SMALL};
  }

  @media only screen and (max-width: 500px) {
    height: ${SLOT_SIZE_XSMALL};
    width: ${SLOT_SIZE_XSMALL};
  }

  @media only screen and (max-width: 400px) {
    height: ${SLOT_SIZE_XXSMALL};
    width: ${SLOT_SIZE_XXSMALL};
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
  id: PropTypes.string,
  item: PropTypes.objectOf(PropTypes.string),
  onRemove: PropTypes.func,
  size: PropTypes.string,
  type: PropTypes.oneOf(SLOT_TYPES).isRequired,
};

Slot.defaultProps = {
  background: '',
  disabled: false,
  id: '',
  item: null,
  onRemove: noop,
  size: null,
};

export default Slot;
