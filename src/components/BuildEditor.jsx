import {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch, batch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import compact from 'lodash/compact';
import sortBy from 'lodash/sortBy';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import { customAlphabet } from 'nanoid';
import FlexGroup from './common/FlexGroup';
import TextInput from './common/TextInput';
import Button from './common/Button';
import LoadingAnimation from './common/LoadingAnimation';
import Chips from './common/Chips';
import TextAreaInput from './common/TextAreaInput';
import EquipmentEditor from './EquipmentEditor';
import TearEditor from './TearEditor';
import SpellEditor from './SpellEditor';
import StatEditor from './StatEditor';
import useAuth from '../hooks/useAuth';
import useUser from '../hooks/useUser';
import armorData from '../data/armorIndexed.json';
import arrowsAndBoltsData from '../data/arrowsAndBolts.json';
import consumablesData from '../data/consumables.json';
import weaponsAndShieldsData from '../data/weaponsAndShields.json';
import spellsData from '../data/spells.json';
import talismansData from '../data/talismans.json';
import tearsData from '../data/tears.json';
import { clearApp } from '../store/app';
import {
  COLOR_DARK_GREEN,
  COLOR_DARKER_GREEN,
  COLOR_GREEN,
  COLOR_GOLD,
  COLOR_LIGHT_GREEN,
  COLOR_LIGHTEST_GREEN,
  COLOR_LIGHTEST_GREEN_LOW_OPACITY,
} from '../constants';
import {
  selectArc,
  selectDex,
  selectEnd,
  selectFai,
  selectInt,
  selectMind,
  selectStr,
  selectVigor,
  selectSpells,
  selectTears,
  selectHelm,
  selectLeg,
  selectChest,
  selectGauntlet,
  selectArrows,
  selectCons,
  selectTals,
  selectWeapons,
  selectWeaponAffinities,
  selectWeaponSkills,
} from '../store/selectors';
import {
  clearStats,
  updateArc,
  updateDex,
  updateEnd,
  updateFai,
  updateInt,
  updateMind,
  updateStr,
  updateVigor,
} from '../store/stats';
import {
  clearEquipment,
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateArrow,
  updateCon,
  updateTal,
  updateWeapon,
  updateWeaponAffinity,
  updateWeaponSkill,
} from '../store/equipment';
import {
  clearSpells,
  updateSpell,
} from '../store/spells';
import {
  clearTears,
  updateTear,
} from '../store/tears';
import {
  addComment,
  getBuild,
  getUser,
  handleUserLike,
  saveBuild,
} from '../firebase';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

function BuildEditor() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveCommentLoading, setSaveCommentLoading] = useState(false);
  const [buildId, setBuildId] = useState(null);
  const [editable, setEditable] = useState(false);
  const [handlingLike, setHandlingLike] = useState(false);
  const [likedBuilds, setLikedBuilds] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentUsers, setCommentUsers] = useState({});
  const [buildUser, setBuildUser] = useState({});
  const [userOwnsBuild, setUserOwnsBuild] = useState(false);

  const auth = useAuth();
  const loggedInUser = useUser();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const spells = useSelector(selectSpells);
  const tears = useSelector(selectTears);
  const arc = useSelector(selectArc);
  const dex = useSelector(selectDex);
  const end = useSelector(selectEnd);
  const fai = useSelector(selectFai);
  const int = useSelector(selectInt);
  const mind = useSelector(selectMind);
  const str = useSelector(selectStr);
  const vigor = useSelector(selectVigor);
  const helm = useSelector(selectHelm);
  const leg = useSelector(selectLeg);
  const chest = useSelector(selectChest);
  const gauntlet = useSelector(selectGauntlet);
  const arrows = useSelector(selectArrows);
  const cons = useSelector(selectCons);
  const tals = useSelector(selectTals);
  const weapons = useSelector(selectWeapons);
  const weaponSkills = useSelector(selectWeaponSkills);
  const weaponAffinities = useSelector(selectWeaponAffinities);

  const clearState = useCallback(() => {
    batch(() => {
      dispatch(clearApp());
      dispatch(clearEquipment());
      dispatch(clearSpells());
      dispatch(clearStats());
      dispatch(clearTears());
    });
  }, [dispatch]);

  useEffect(() => {
    clearState();
  }, [dispatch, clearState]);

  const handleNameChange = (value) => {
    setName(value);
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
  };

  const level = useMemo(() => (
    String(Math.max((Number(arc) + Number(dex) + Number(end) + Number(fai)
    + Number(int) + Number(mind) + Number(str) + Number(vigor)) - 79, 1))
  ), [arc, dex, end, fai, int, mind, str, vigor]);

  useEffect(() => {
    const savedBuildId = params?.buildId ?? 'new';
    setBuildId(savedBuildId);
    if (savedBuildId === 'new' && auth) {
      setEditable(true);
    } else if (savedBuildId === 'new' && auth === false) {
      navigate('/');
    }
  }, [params, auth, navigate]);

  useEffect(() => {
    if (buildId !== null && buildId !== 'new' && loading) {
      clearState();
      const run = async () => {
        const data = await getBuild(buildId);
        if (data) {
          const {
            user,
            name: savedName,
            description: savedDescription,
            tags: savedTags = [],
            likes: savedLikes = 0,
            comments: savedComments = [],
            arc: savedArc,
            dex: savedDex,
            end: savedEnd,
            fai: savedFai,
            int: savedInt,
            mind: savedMind,
            str: savedStr,
            vigor: savedVigor,
            arrows: savedArrows = [],
            cons: savedCons = [],
            tals: savedTals = [],
            weapons: savedWeapons = [],
            weaponAffinities: savedWeaponAffinities = [],
            weaponSkills: savedWeaponSkills = [],
            spells: savedSpells = [],
            tears: savedTears = [],
            helm: savedHelm,
            leg: savedLeg,
            chest: savedChest,
            gauntlet: savedGauntlet,
          } = data;
          if (user === auth?.uid) {
            setUserOwnsBuild(true);
          }
          setName(savedName);
          setDescription(savedDescription);
          setTags(savedTags);
          setLikes(savedLikes);
          setComments(savedComments);
          const helmObj = armorData.helms[savedHelm];
          const legObj = armorData.legs[savedLeg];
          const chestObj = armorData.chests[savedChest];
          const gauntletObj = armorData.gauntlets[savedGauntlet];
          batch(() => {
            savedArrows.forEach((savedArrowName, i) => {
              const item = arrowsAndBoltsData
                .find(({ name: arrowName }) => arrowName === savedArrowName);
              const id = i + 1;
              dispatch(updateArrow({ item, id: `arrow${id}` }));
            });
            savedCons.forEach((savedConName, i) => {
              const item = consumablesData
                .find(({ name: conName }) => conName === savedConName);
              const id = i + 1;
              dispatch(updateCon({ item, id: `con${id}` }));
            });
            savedTals.forEach((savedTalName, i) => {
              const item = talismansData
                .find(({ name: talName }) => talName === savedTalName);
              const id = i + 1;
              dispatch(updateTal({ item, id: `tal${id}` }));
            });
            savedSpells.forEach((savedSpellName, i) => {
              const item = spellsData
                .find(({ name: spellName }) => spellName === savedSpellName);
              const id = i + 1;
              dispatch(updateSpell({ item, id: `spell${id}` }));
            });
            savedTears.forEach((savedTearName, i) => {
              const item = tearsData
                .find(({ name: tearName }) => tearName === savedTearName);
              const id = i + 1;
              dispatch(updateTear({ item, id: `tear${id}` }));
            });
            savedWeapons.forEach((savedWeaponName, i) => {
              const item = weaponsAndShieldsData[savedWeaponName];
              const id = i + 1;
              dispatch(updateWeapon({ item, id: `weapon${id}` }));
            });
            savedWeaponAffinities.forEach((savedWeaponAffinityName, i) => {
              const item = savedWeaponAffinityName;
              const id = i + 1;
              dispatch(updateWeaponAffinity({ item, id: `weaponAffinity${id}` }));
            });
            savedWeaponSkills.forEach((savedWeaponSkillName, i) => {
              const item = savedWeaponSkillName;
              const id = i + 1;
              dispatch(updateWeaponSkill({ item, id: `weaponSkill${id}` }));
            });
            dispatch(updateHelm(helmObj));
            dispatch(updateLeg(legObj));
            dispatch(updateChest(chestObj));
            dispatch(updateGauntlet(gauntletObj));
            dispatch(updateArc(savedArc));
            dispatch(updateDex(savedDex));
            dispatch(updateEnd(savedEnd));
            dispatch(updateFai(savedFai));
            dispatch(updateInt(savedInt));
            dispatch(updateMind(savedMind));
            dispatch(updateStr(savedStr));
            dispatch(updateVigor(savedVigor));
          });
          const result = await getUser(user);
          setBuildUser(result);
        }
        setLoading(false);
      };
      run();
    } else if (buildId === 'new') {
      setLoading(false);
    }
  }, [buildId, dispatch, loading, auth, clearState]);

  const handleSave = async () => {
    setSaveLoading(true);
    const build = {
      user: auth.uid,
      name,
      description,
      tags,
      level,
      likes: 0,
      comments: [],
      arrows,
      cons,
      tals,
      weapons,
      weaponAffinities,
      weaponSkills,
      spells,
      tears,
      arc,
      dex,
      end,
      fai,
      int,
      mind,
      str,
      vigor,
      helm: helm?.name ?? null,
      leg: leg?.name ?? null,
      chest: chest?.name ?? null,
      gauntlet: gauntlet?.name ?? null,
    };
    const newId = nanoid();
    if (auth?.uid) {
      const { success, savedBuildId } = await saveBuild(buildId, build, newId, auth?.uid);
      if (success && savedBuildId) {
        setBuildId(savedBuildId);
        setLoading(true);
        navigate(`/build/${savedBuildId}`);
      }
    }
    setEditable(false);
    setSaveLoading(false);
  };

  const handleAddTag = (tag) => {
    setTags((prevTags) => (
      compact([...prevTags, tag])
    ));
  };

  const handleRemoveTag = (value) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== value));
  };

  useEffect(() => {
    const { likedBuilds: savedLikedBuilds = [] } = loggedInUser || {};
    setLikedBuilds(savedLikedBuilds);
  }, [loggedInUser]);

  const handleLike = async () => {
    if (!handlingLike && auth && loggedInUser) {
      setHandlingLike(true);
      const shouldAdd = !likedBuilds.includes(buildId);
      if (shouldAdd) {
        setLikedBuilds([...likedBuilds, buildId]);
      } else {
        setLikedBuilds(likedBuilds.filter((id) => id !== buildId));
      }
      setLikes((prevLikes) => (shouldAdd ? (prevLikes + 1) : (prevLikes - 1)));
      try {
        await handleUserLike(auth.uid, buildId, shouldAdd);
        setHandlingLike(false);
      } catch (error) {
        console.log(error.message);
      }
    }
  };

  const handleChangeComment = (value) => {
    setCommentText(value);
  };

  const isLoggedIn = auth && auth?.uid && loggedInUser;

  const handleSaveComment = async () => {
    if (isLoggedIn) {
      setSaveCommentLoading(true);
      await addComment(auth.uid, buildId, commentText);
      setCommentText('');
      window.location.reload();
      setSaveCommentLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      const result = await Promise.all(comments.map(({ user: userId }) => (
        getUser(userId)
      )));
      const users = {};
      result.forEach((user) => {
        users[user.id] = user;
      });
      setCommentUsers(users);
    };
    run();
  }, [comments]);

  const sortedComments = useMemo(() => (
    sortBy(comments, ({ date = -Infinity }) => date).reverse()
  ), [comments]);

  const handleNavigateUser = () => {
    if (buildUser.id) {
      navigate(`/user/${buildUser.id}`);
    }
  };

  const handleEdit = () => {
    setEditable(true);
  };

  if (auth === null) {
    return null;
  }

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingAnimation
          size={50}
        />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      {editable ? null : (
        <TitleContainer
          vertical
        >
          <NameContainer>
            {name}
          </NameContainer>
          {buildUser?.name ? (
            <CreatedByContainer>
              Created by:
              <CreatedBy
                onClick={handleNavigateUser}
              >
                {buildUser?.name}
              </CreatedBy>
            </CreatedByContainer>
          ) : null}
          <LikesContainer>
            {(auth && loggedInUser) ? (
              <LikesTag
                onClick={handleLike}
              >
                {`${likes} ${likes === 1 ? 'Like' : 'Likes'}`}
              </LikesTag>
            ) : (
              <Tag>
                {`${likes} ${likes === 1 ? 'Like' : 'Likes'}`}
              </Tag>
            )}
          </LikesContainer>
        </TitleContainer>
      )}
      <UpperSection>
        <LeftColumn
          vertical
        >
          {editable ? (
            <HeaderContainer
              vertical
            >
              <Header>
                Build Name
              </Header>
              <NameInputContainer>
                <TextInput
                  onChange={handleNameChange}
                  value={name}
                />
              </NameInputContainer>
            </HeaderContainer>
          ) : null}
          {editable ? (
            <TagContainer
              vertical
            >
              <Header>
                Tags
              </Header>
              <Chips
                onAdd={handleAddTag}
                onRemove={handleRemoveTag}
                values={tags}
              />
            </TagContainer>
          ) : null}
          <EditorContainer>
            <EquipmentEditor
              editable={editable}
            />
          </EditorContainer>
        </LeftColumn>
        <RightColumn
          vertical
        >
          <EditorContainer>
            <StatEditor
              editable={editable}
              level={level}
            />
          </EditorContainer>
          <EditorContainer>
            <TearEditor
              editable={editable}
            />
          </EditorContainer>
          <EditorContainer>
            <SpellEditor
              editable={editable}
            />
          </EditorContainer>
        </RightColumn>
      </UpperSection>
      <LowerSection
        vertical
      >
        <DescriptionSectionContainer
          vertical
        >
          {(editable || description.length) ? (
            <Header>
              Description
            </Header>
          ) : null}
          <DescriptionInputContainer>
            {editable ? (
              <StyledMarkdownEditor
                height={300}
                onChange={handleDescriptionChange}
                preview="edit"
                previewOptions={{
                  rehypePlugins: [[rehypeSanitize]],
                }}
                value={description}
              />
            ) : null}
            {!editable && description.length ? (
              <DescriptionContainer>
                <StyledMarkdownPreview
                  rehypePlugins={[[rehypeSanitize]]}
                  source={description}
                />
              </DescriptionContainer>
            ) : null}
          </DescriptionInputContainer>
        </DescriptionSectionContainer>
        {(editable || tags.length <= 0) ? null : (
          <TagViewContainer>
            <TagLabel>
              Tags:
            </TagLabel>
            <TagDisplay>
              {tags.map((tag) => (
                <Tag
                  key={tag}
                >
                  {tag}
                </Tag>
              ))}
            </TagDisplay>
          </TagViewContainer>
        )}
        {editable ? (
          <SaveContainer>
            {saveLoading ? (
              <LoadingAnimation
                size={30}
              />
            ) : (
              <Button
                disabled={saveLoading || !isLoggedIn}
                onClick={handleSave}
              >
                Save
              </Button>
            )}
          </SaveContainer>
        ) : null}
        {(!editable && userOwnsBuild) ? (
          <EditContainer>
            <Button
              onClick={handleEdit}
            >
              Edit
            </Button>
          </EditContainer>
        ) : null}
        {editable ? null : (
          <CommentsContainer>
            <CommentsView>
              <CommentTitleContainer>
                Comments
              </CommentTitleContainer>
              {sortedComments.length ? (
                <UserCommentsContainer
                  vertical
                >
                  {sortedComments.map(({ comment, user, date }) => (
                    <UserCommentContainer
                      key={`${comment}${date}`}
                      vertical
                    >
                      <UserContainer>
                        <Link
                          to={`/user/${user}`}
                        >
                          {commentUsers?.[user]?.name}
                        </Link>
                      </UserContainer>
                      <FlexGroup>
                        {comment}
                      </FlexGroup>
                    </UserCommentContainer>
                  ))}
                </UserCommentsContainer>
              ) : (
                <NoCommentsContainer>
                  None for this build
                </NoCommentsContainer>
              )}
            </CommentsView>
            <CommentsPost>
              <CommentTitleContainer>
                Post a comment
              </CommentTitleContainer>
              <CommentTextAreaContainer>
                <TextAreaInput
                  disabled={!isLoggedIn}
                  onChange={handleChangeComment}
                  value={commentText}
                />
              </CommentTextAreaContainer>
              <SaveCommentContainer>
                <Button
                  disabled={!commentText || saveCommentLoading || !isLoggedIn}
                  onClick={handleSaveComment}
                >
                  Post
                </Button>
              </SaveCommentContainer>
            </CommentsPost>
          </CommentsContainer>
        )}
      </LowerSection>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  flex-direction: column;
  align-items: center;
`;

const TitleContainer = styled(FlexGroup)`
  margin-bottom: 30px;
`;

const Header = styled(FlexGroup)`
  color: ${COLOR_LIGHTEST_GREEN};
  font-size: 26px;
`;

const UpperSection = styled(FlexGroup)`
  min-height: 400px;
  width: 100%;

  @media only screen and (max-width: 1100px) {
    flex-direction: column;
  }
`;

const LowerSection = styled(FlexGroup)`
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 30px;
  margin-top: 20px;
  width: 95%;
`;

const EditorContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  margin-bottom: 23px;
`;

const HeaderContainer = styled(EditorContainer)`
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  margin-top: 20px;
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

const LoadingContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const NameInputContainer = styled(FlexGroup)`
  width: 400px;
  margin-top: 5px;

  @media only screen and (max-width: 1400px) {
    width: 300px;
  }

  @media only screen and (max-width: 1100px) {
    width: 250px;
  }
`;

const NameContainer = styled(FlexGroup)`
  font-size: 40px;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
  font-family: "OptimusPrincepsSemiBold", serif;
  text-shadow: 0px 0px 4px ${COLOR_GOLD};
  color: ${COLOR_LIGHTEST_GREEN};
`;

const TagLabel = styled(FlexGroup)`
  font-size: 18px;
  color: ${COLOR_LIGHTEST_GREEN};
  margin-right: 10px;
`;

const DescriptionInputContainer = styled(FlexGroup)`
  margin-top: 20px;
  width: 100%;
`;

const DescriptionContainer = styled(FlexGroup)`
  flex-direction: column;
  margin-bottom: 25px;
`;

const StyledMarkdownEditor = styled(MDEditor)`
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  max-width: 100%;
  width: 100%;
  font-family: garamond-premier-pro,  serif;

  & .w-md-editor-text-input {
    font-size: 20px;
  }

  & .w-md-editor-toolbar {
    background-color: ${COLOR_DARKER_GREEN};
    color: ${COLOR_GOLD};
    font-family: garamond-premier-pro,  serif;

    & svg {
      color: ${COLOR_GOLD};
    }
  }

  & .w-md-editor-preview {
    background-color: ${COLOR_DARK_GREEN};
    color: ${COLOR_GOLD};
    font-family: garamond-premier-pro,  serif;
  }
`;

const StyledMarkdownPreview = styled(MDEditor.Markdown)`
  background-color: ${COLOR_DARK_GREEN} !important;
  color: ${COLOR_GOLD} !important;
  font-family: garamond-premier-pro,  serif !important;
  font-size: 18px !important;
`;

const LeftColumn = styled(FlexGroup)`
  max-width: 50%;
  width: 50%;
  align-items: center;

  @media only screen and (max-width: 1100px) {
    max-width: 100%;
    width: 100%;
  }
`;

const RightColumn = styled(FlexGroup)`
  max-width: 50%;
  width: 50%;
  align-items: center;

  @media only screen and (max-width: 1100px) {
    max-width: 100%;
    width: 100%;
  }
`;

const SaveContainer = styled(EditorContainer)`
  justify-content: center;
  margin-top: 50px;
  margin-bottom: -10px;
  width: 100%;
  
  & > button {
    width: 250px;
  }
`;

const EditContainer = styled(EditorContainer)`
  justify-content: center;
  margin-top: 20px;
  width: 100%;
  
  & > button {
    width: 250px;
  }
`;

const TagContainer = styled(EditorContainer)`
  max-width: 76%;
  width: 76%;
  z-index: 10;
`;

const Tag = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  height: 30px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 14px;
`;

const TagDisplay = styled(FlexGroup)`
  justify-content: center;
`;

const TagViewContainer = styled(FlexGroup)`
  align-items: center;
  margin-bottom: 20px;
  margin-top: 10px;
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

const SaveCommentContainer = styled(FlexGroup)`
  justify-content: center;
  margin-top: 20px;
`;

const CommentTitleContainer = styled(FlexGroup)`
  font-size: 24px;
  margin-bottom: 10px;
  color: ${COLOR_LIGHTEST_GREEN};
`;

const UserCommentsContainer = styled(FlexGroup)`
  margin-bottom: 20px;
  margin-top: 15px;
`;

const UserCommentContainer = styled(FlexGroup)`
  border-bottom: 1px dashed ${COLOR_LIGHT_GREEN};
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-size: 18px;

  &:last-child {
    border: none;
  }
`;

const UserContainer = styled(FlexGroup)`
  color: ${COLOR_LIGHTEST_GREEN};
  cursor: pointer;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 10px;
`;

const CommentTextAreaContainer = styled(FlexGroup)`
  height: 100px;
  width: 100%;
  margin-top: 15px;
`;

const NoCommentsContainer = styled(FlexGroup)`
  font-size: 18px;
`;

const CommentsContainer = styled(FlexGroup)`
  width: 100%;
  border-top: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  padding-top: 20px;

  @media only screen and (max-width: 800px) {
    flex-direction: column;
  }
`;

const CommentsPost = styled(FlexGroup)`
  align-items: flex-start;
  flex-direction: column;
  width: 40%;
  padding-left: 30px;

  @media only screen and (max-width: 800px) {
    width: 100%;
    padding-left: 0px;
  }
`;

const CommentsView = styled(FlexGroup)`
  flex-direction: column;
  width: 60%;

  @media only screen and (max-width: 800px) {
    width: 100%;
  }
`;

const DescriptionSectionContainer = styled(FlexGroup)`
  width: 100%;
`;

export default BuildEditor;
