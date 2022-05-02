import styled from 'styled-components';
import PropTypes from 'prop-types';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_GOLD,
  COLOR_DARK_GREEN,
} from '../../constants';

function DropDown({
  onChange,
  options,
  placeholder,
  value,
}) {
  const handleChange = (e) => {
    const { value: newValue } = e.target;
    if (newValue) {
      onChange(newValue);
    }
  };

  return (
    <Container
      onChange={handleChange}
      value={value}
    >
      <Option
        value=""
      >
        {placeholder}
      </Option>
      {options.map((option) => (
        <Option
          key={option}
          value={option}
        >
          {option}
        </Option>
      ))}
    </Container>
  );
}

const Container = styled.select`
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 2px;
  box-sizing: border-box;
  height: 40px;
  width: 100%;
  outline: none;
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  font-size: 16px;
  font-family: garamond-premier-pro,  serif;
  box-shadow: inset 0 0 3px ${COLOR_DARK_GREEN};
  cursor: pointer;
`;

const Option = styled.option`
  text-align: center;
`;

DropDown.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default DropDown;
