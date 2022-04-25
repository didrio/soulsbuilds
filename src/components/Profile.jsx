import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import FlexGroup from './common/FlexGroup';
import BuildsList from './common/BuildsList';
import Button from './common/Button';
import { getBuild, getUser } from '../firebase';
import {
  COLOR_LIGHTEST_GREEN,
} from '../constants';
import useAuth from '../hooks/useAuth';

function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    const paramUserId = params?.userId ?? null;
    if (!paramUserId) {
      navigate('/');
    }
    setUserId(paramUserId);
  }, [params, navigate]);

  useEffect(() => {
    if (userId) {
      const run = async () => {
        const result = await getUser(userId);
        setUser(result);
      };
      run();
    }
  }, [userId]);

  useEffect(() => {
    if (user && Array.isArray(user.builds) && user.builds.length > 0) {
      const run = async () => {
        const result = await Promise.all(user.builds.map((buildId) => (
          getBuild(buildId)
        )));
        setBuilds(result);
      };
      run();
    }
  }, [user]);

  const handleNavigateNewBuild = () => {
    navigate('/build/new');
  };

  const isCurrentUser = userId && auth?.uid === userId;

  return (
    <FlexGroup
      vertical
    >
      <HeaderContainer
        vertical
      >
        <Header>
          {user?.name || ''}
        </Header>
      </HeaderContainer>
      {builds.length > 0 ? (
        <FlexGroup
          vertical
        >
          <SubHeader>
            Builds
          </SubHeader>
          <BuildsListContainer>
            <BuildsList
              builds={builds}
            />
          </BuildsListContainer>
        </FlexGroup>
      ) : (
        <SubHeader>
          This user has no builds
        </SubHeader>
      )}
      {isCurrentUser ? (
        <NewBuildContainer>
          <Button
            onClick={handleNavigateNewBuild}
          >
            + Create New Build
          </Button>
        </NewBuildContainer>
      ) : null}
    </FlexGroup>
  );
}

const HeaderContainer = styled(FlexGroup)`
  align-items: center;
`;

const Header = styled.h2`
  color: ${COLOR_LIGHTEST_GREEN};
  margin-bottom: 20px;
  font-size: 26px;
`;

const SubHeader = styled(FlexGroup)`
  font-size: 20px;
  margin-bottom: 20px;
`;

const BuildsListContainer = styled(FlexGroup)`
  width: 100%;
`;

const NewBuildContainer = styled(FlexGroup)`
  margin-top: 20px;
  justify-content: center;
  width: 100%;

  & > button {
    width: 250px;
  }
`;

export default Profile;
