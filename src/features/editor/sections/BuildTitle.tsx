import { useNavigate } from 'react-router';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import Tag from '@/components/ui/Tag';
import type { User } from '@/lib/models';
import { COLOR_GOLD, COLOR_LIGHT_GREEN, COLOR_LIGHTEST_GREEN, FONT_DISPLAY } from '@/theme';

interface BuildTitleProps {
  buildUser: Partial<User> | false;
  /** Signed in with a loaded user doc: the like counter is a toggle. */
  canLike: boolean;
  likes: number;
  name: string;
  onLike: () => void;
}

/** View mode header: build name, "Created by", and the like counter. */
function BuildTitle({ buildUser, canLike, likes, name, onLike }: BuildTitleProps) {
  const navigate = useNavigate();

  const handleNavigateUser = () => {
    if (buildUser && buildUser.id) {
      navigate(`/user/${buildUser.id}`);
    }
  };

  const likesLabel = `${likes} ${likes === 1 ? 'Like' : 'Likes'}`;

  return (
    <TitleContainer vertical>
      <NameContainer>{name}</NameContainer>
      {buildUser && buildUser.name ? (
        <CreatedByContainer>
          Created by:
          <CreatedBy onClick={handleNavigateUser}>{buildUser.name}</CreatedBy>
        </CreatedByContainer>
      ) : null}
      <LikesContainer>
        {canLike ? <LikesTag onClick={onLike}>{likesLabel}</LikesTag> : <Tag>{likesLabel}</Tag>}
      </LikesContainer>
    </TitleContainer>
  );
}

const TitleContainer = styled(FlexGroup)`
  margin-bottom: 30px;
`;

const NameContainer = styled(FlexGroup)`
  font-size: 40px;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
  font-family: ${FONT_DISPLAY};
  text-shadow: 0px 0px 4px ${COLOR_GOLD};
  color: ${COLOR_LIGHTEST_GREEN};
`;

const CreatedByContainer = styled(FlexGroup)`
  justify-content: center;
`;

const CreatedBy = styled(FlexGroup)`
  color: ${COLOR_LIGHTEST_GREEN};
  font-weight: bold;
  cursor: pointer;
  margin-left: 5px;
`;

const LikesContainer = styled(FlexGroup)`
  justify-content: center;
  margin-top: 15px;
`;

const LikesTag = styled(Tag)`
  cursor: pointer;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

export default BuildTitle;
