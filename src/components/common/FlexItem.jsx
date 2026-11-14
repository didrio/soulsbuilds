import PropTypes from 'prop-types';
import styled from 'styled-components';

const getAlignSelf = ({ alignSelf }) => alignSelf;
const getFlexBasis = ({ basis }) => basis;

function FlexItem({ alignSelf = 'auto', basis = '1', children, className = '' }) {
  return (
    <Container alignSelf={alignSelf} basis={basis} className={className}>
      {children}
    </Container>
  );
}

const Container = styled.div`
  align-self: ${getAlignSelf};
  flex-basis: ${getFlexBasis};
`;

FlexItem.propTypes = {
  alignSelf: PropTypes.string,
  basis: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default FlexItem;
