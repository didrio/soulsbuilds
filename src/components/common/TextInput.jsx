import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_GOLD,
} from '../../constants';

function TextInput({
  centered,
  disabled,
  onChange,
  type,
  value,
}) {
  const handleChange = (e) => {
    const { value: inputValue } = e.target;
    onChange(inputValue, e);
  };

  return (
    <Container
      centered={centered}
      disabled={disabled}
      onChange={handleChange}
      type={type}
      value={value}
    />
  );
}

const Container = styled.input`
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 2px;
  box-sizing: border-box;
  height: 40px;
  width: 100%;
  padding: 5px 10px;
  outline: none;
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  font-size: 16px;
  text-align: ${({ centered }) => (centered ? 'center' : 'left')};
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  font-family: garamond-premier-pro,  serif;
`;

TextInput.propTypes = {
  centered: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

TextInput.defaultProps = {
  centered: false,
  disabled: false,
  type: 'text',
};

export default TextInput;
