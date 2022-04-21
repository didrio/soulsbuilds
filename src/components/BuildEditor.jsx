import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch, batch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import flatten from 'lodash/flatten';
import FlexItem from './common/FlexItem';
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

  useEffect(() => {
    const savedBuildId = params?.buildId ?? 'new';
    setBuildId(savedBuildId);
    if (savedBuildId === 'new') {
      setEditable(true);
    }
  }, [params]);

  useEffect(() => {
    if (buildId !== null && buildId !== 'new' && loading) {
      const run = async () => {
        const data = await getBuild(buildId);
        if (data) {
          const {
            user,
            name: savedName,
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

  const handleNameChange = (value) => {
    setName(value);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    const build = {
      user: auth.uid,
      name,
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
    <Container
      vertical
    >
      <EditorContainer>
        <FlexItem
          basis="15%"
        >
          Build name:
        </FlexItem>
        <FlexItem
          basis="30%"
        >
          {editable ? (
            <TextInput
              onChange={handleNameChange}
              value={name}
            />
          ) : (
            <NameContainer>
              name
            </NameContainer>
          )}
        </FlexItem>
      </EditorContainer>
      {editable ? (
        <EditorContainer>
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
        </EditorContainer>
      ) : null}
      <EditorContainer>
        <StatEditor
          editable={editable}
        />
      </EditorContainer>
      <EditorContainer>
        <EquipmentEditor
          editable={editable}
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
    </Container>
  );
}

const Container = styled(FlexGroup)`
  min-height: 400px;
`;

const EditorContainer = styled(FlexGroup)`
  align-items: center;
  margin-bottom: 50px;
`;

const LoadingContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const NameContainer = styled.h2`
  margin: 0;
  padding: 0;
`;

export default BuildEditor;
