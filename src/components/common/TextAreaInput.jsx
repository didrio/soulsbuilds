import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_GOLD,
} from '../../constants';

function TextAreaInput({
  disabled,
  onChange,
  value,
}) {
  const handleChange = (e) => {
    const { value: inputValue } = e.target;
    onChange(inputValue, e);
  };

  return (
    <Container
      disabled={disabled}
      onChange={handleChange}
      rows="5"
      type="textarea"
      value={value}
    />
  );
}

const Container = styled.textarea`
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 2px;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  padding: 5px 10px;
  outline: none;
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  font-size: 16px;
  text-align: ${({ centered }) => (centered ? 'center' : 'left')};
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  font-family: garamond-premier-pro,  serif;
  resize: none;
`;

TextAreaInput.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

TextAreaInput.defaultProps = {
  disabled: false,
};

export default TextAreaInput;
