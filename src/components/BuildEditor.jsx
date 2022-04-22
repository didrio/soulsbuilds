import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch, batch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import flatten from 'lodash/flatten';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import FlexGroup from './common/FlexGroup';
import TextInput from './common/TextInput';
import Button from './common/Button';
import LoadingAnimation from './common/LoadingAnimation';
import EquipmentEditor from './EquipmentEditor';
import TearEditor from './TearEditor';
import SpellEditor from './SpellEditor';
import StatEditor from './StatEditor';
import { getBuild, saveBuild } from '../firebase';
import useAuth from '../hooks/useAuth';
import armorData from '../data/armor.json';
import arrowsAndBoltsData from '../data/arrowsAndBolts.json';
import consumablesData from '../data/consumables.json';
import shieldsData from '../data/shields.json';
import spellsData from '../data/spells.json';
import talismansData from '../data/talismans.json';
import tearsData from '../data/tears.json';
import weaponsData from '../data/weapons.json';
import {
  COLOR_DARK_GREEN,
  COLOR_DARKER_GREEN,
  COLOR_GREEN,
  COLOR_GOLD,
  COLOR_LIGHTEST_GREEN,
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
} from '../store/selectors';
import {
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
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateArrow,
  updateCon,
  updateTal,
  updateWeapon,
} from '../store/equipment';
import { updateSpell } from '../store/spells';
import { updateTear } from '../store/tears';

const shieldsAndWeaponsData = ([
  ...flatten(Object.values(shieldsData)),
  ...flatten(Object.values(weaponsData)),
]);

function BuildEditor() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [buildId, setBuildId] = useState(null);
  const [editable, setEditable] = useState(false);

  const auth = useAuth();
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

  const handleNameChange = (value) => {
    setName(value);
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
  };

  const level = useMemo(() => (
    String(Number(arc) + Number(dex) + Number(end) + Number(fai)
    + Number(int) + Number(mind) + Number(str) + Number(vigor))
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
      const run = async () => {
        const data = await getBuild(buildId);
        if (data) {
          const {
            user,
            name: savedName,
            description: savedDescription,
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
            spells: savedSpells = [],
            tears: savedTears = [],
            helm: savedHelm,
            leg: savedLeg,
            chest: savedChest,
            gauntlet: savedGauntlet,
          } = data;
          if (user === auth.uid) {
            setEditable(true);
          }
          setName(savedName);
          setDescription(savedDescription);
          const helmObj = armorData.helms
            .find(({ name: helmName }) => helmName === savedHelm);
          const legObj = armorData.legs
            .find(({ name: legName }) => legName === savedLeg);
          const chestObj = armorData.chests
            .find(({ name: chestName }) => chestName === savedChest);
          const gauntletObj = armorData.gauntlets
            .find(({ name: gauntletName }) => gauntletName === savedGauntlet);
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
              const item = shieldsAndWeaponsData
                .find(({ name: weaponName }) => weaponName === savedWeaponName);
              const id = i + 1;
              dispatch(updateWeapon({ item, id: `weapon${id}` }));
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
        }
        setLoading(false);
      };
      run();
    } else if (buildId === 'new') {
      setLoading(false);
    }
  }, [buildId, dispatch, loading, auth]);

  const handleSave = async () => {
    setSaveLoading(true);
    const build = {
      user: auth.uid,
      name,
      description,
      level,
      arrows,
      cons,
      tals,
      weapons,
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
    const { success, savedBuildId } = await saveBuild(buildId, build);
    if (success && savedBuildId) {
      navigate(`/builds/${savedBuildId}`);
    }
    setSaveLoading(false);
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
        <NameContainer>
          {name}
        </NameContainer>
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
        {editable ? (
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
          ) : (
            <DescriptionContainer>
              <StyledMarkdownPreview
                rehypePlugins={[[rehypeSanitize]]}
                source={description}
              />
            </DescriptionContainer>
          )}
        </DescriptionInputContainer>
        {editable ? (
          <SaveContainer>
            {saveLoading ? (
              <LoadingAnimation
                size={30}
              />
            ) : (
              <Button
                onClick={handleSave}
              >
                Save
              </Button>
            )}
          </SaveContainer>
        ) : null}
      </LowerSection>
    </Container>
  );
}

const Header = styled.h2`
  color: ${COLOR_LIGHTEST_GREEN};
  margin-bottom: 20px;
  font-size: 26px;
`;

const Container = styled(FlexGroup)`
  flex-direction: column;
  min-height: 400px;
`;

const UpperSection = styled(FlexGroup)`
  min-height: 400px;

  @media only screen and (max-width: 1100px) {
    flex-direction: column;
  }
`;

const LowerSection = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  margin-top: 20px;
  width: 100%;
`;

const EditorContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  margin-bottom: 23px;
`;

const HeaderContainer = styled(EditorContainer)`
  align-items: center;
  justify-content: center;
`;

const LoadingContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const NameInputContainer = styled(FlexGroup)`
  width: 400px;

  @media only screen and (max-width: 1400px) {
    width: 300px;
  }

  @media only screen and (max-width: 1100px) {
    width: 250px;
  }
`;

const NameContainer = styled(FlexGroup)`
  font-size: 34px;
  justify-content: center;
  margin-bottom: 30px;
  margin-top: 10px;
`;

const DescriptionInputContainer = styled(FlexGroup)`
  margin-top: 20px;
  width: 100%;
`;

const DescriptionContainer = styled.h2`
  margin: 0;
  padding: 0;
`;

const StyledMarkdownEditor = styled(MDEditor)`
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  max-width: 100%;
  width: 100%;
  font-family: garamond-premier-pro,  serif;

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
  background-color: ${COLOR_DARK_GREEN};
  color: ${COLOR_GOLD};
  font-family: garamond-premier-pro,  serif;
`;

const LeftColumn = styled(FlexGroup)`
  max-width: 50%;
  width: 50%;

  @media only screen and (max-width: 1100px) {
    max-width: 100%;
    width: 100%;
  }
`;

const RightColumn = styled(FlexGroup)`
  max-width: 50%;
  width: 50%;

  @media only screen and (max-width: 1100px) {
    max-width: 100%;
    width: 100%;
  }
`;

const SaveContainer = styled(EditorContainer)`
  justify-content: center;
  margin-top: 50px;
  margin-bottom: -10px;
  
  & > button {
    width: 250px;
  }
`;

export default BuildEditor;
