import PropTypes from 'prop-types';
import styled from 'styled-components';
import noop from 'lodash/noop';

const getFlexDirection = ({ vertical }) => (vertical ? 'column' : 'row');

function FlexGroup({
  basis = '1',
  children,
  className = '',
  onClick = noop,
  onMouseEnter = noop,
  onMouseLeave = noop,
  vertical = false,
}) {
  const handleClick = () => {
    onClick();
  };

  const handleMouseEnter = () => {
    onMouseEnter();
  };

  const handleMouseLeave = () => {
    onMouseLeave();
  };

  return (
    <Container
      basis={basis}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      vertical={vertical}>
      {children}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-basis: ${({ basis }) => basis};
  flex-direction: ${getFlexDirection};
`;

FlexGroup.propTypes = {
  basis: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  vertical: PropTypes.bool,
};

export default FlexGroup;
