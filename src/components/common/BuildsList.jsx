import styled from 'styled-components';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import FlexGroup from './FlexGroup';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
} from '../../constants';

function BuildsList({ builds }) {
  const navigate = useNavigate();

  const handleSelectBuild = (id) => () => {
    navigate(`/build/${id}`);
  };

  return (
    <Container
      vertical
    >
      {builds.map((build) => (
        <Build
          key={build.name}
          onClick={handleSelectBuild(build.id)}
        >
          <FlexGroup>
            {build.name}
          </FlexGroup>
          <FlexGroup>
            {build.likes}
          </FlexGroup>
        </Build>
      ))}
    </Container>
  );
}

const Container = styled(FlexGroup)`
  width: 100%;
`;

const Build = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  height: 40px;
  width: 100%;
  cursor: pointer;
  padding: 0 10px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 18px;
  align-items: center;
  margin-bottom: 15px;
  justify-content: space-between;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

BuildsList.propTypes = {
  builds: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)),
};

BuildsList.defaultProps = {
  builds: [],
};

export default BuildsList;
