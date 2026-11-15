import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import Button from '@/components/ui/Button';
import BuildsList from '@/features/builds/BuildsList';
import useAuth from '@/features/auth/useAuth';
import { getBuild, getUser } from '@/lib/firebase';
import type { Build, User } from '@/lib/models';
import { COLOR_LIGHTEST_GREEN } from '@/theme';

/** `/user/:userId`: display name, the user's builds, and "Create New Build" for the owner. */
function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | false | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);

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
      const ids = user.builds;
      const run = async () => {
        const result = await Promise.all(ids.map((buildId) => getBuild(buildId)));
        setBuilds(result);
      };
      run();
    }
  }, [user]);

  const handleNavigateNewBuild = () => {
    navigate('/build/new');
  };

  const isCurrentUser = userId && auth && auth.uid === userId;

  return (
    <Container vertical>
      <HeaderContainer vertical>
        <Header>{(user && user.name) || ''}</Header>
      </HeaderContainer>
      {builds.length > 0 ? (
        <BuildListContainer vertical>
          <SubHeader>Builds</SubHeader>
          <BuildsListContainer>
            <BuildsList builds={builds} />
          </BuildsListContainer>
        </BuildListContainer>
      ) : (
        <SubHeader>This user has no builds</SubHeader>
      )}
      {isCurrentUser ? (
        <NewBuildContainer>
          <Button onClick={handleNavigateNewBuild}>+ Create New Build</Button>
        </NewBuildContainer>
      ) : null}
    </Container>
  );
}

const Container = styled(FlexGroup)`
  align-items: center;
  width: 100%;
`;

const BuildListContainer = styled(FlexGroup)`
  width: 95%;
`;

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
