import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import FlexGroup from './common/FlexGroup';
import TextInput from './common/TextInput';
import {
  selectArc,
  selectDex,
  selectEnd,
  selectFai,
  selectInt,
  selectMind,
  selectStr,
  selectVigor,
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

function StatEditor({ editable }) {
  const dispatch = useDispatch();

  const arc = useSelector(selectArc);
  const dex = useSelector(selectDex);
  const end = useSelector(selectEnd);
  const fai = useSelector(selectFai);
  const int = useSelector(selectInt);
  const mind = useSelector(selectMind);
  const str = useSelector(selectStr);
  const vigor = useSelector(selectVigor);

  const handleArcChange = (value) => {
    dispatch(updateArc(value));
  };

  const handleDexChange = (value) => {
    dispatch(updateDex(value));
  };

  const handleEndChange = (value) => {
    dispatch(updateEnd(value));
  };

  const handleFaiChange = (value) => {
    dispatch(updateFai(value));
  };

  const handleIntChange = (value) => {
    dispatch(updateInt(value));
  };

  const handleMindChange = (value) => {
    dispatch(updateMind(value));
  };

  const handleStrChange = (value) => {
    dispatch(updateStr(value));
  };

  const handleVigorChange = (value) => {
    dispatch(updateVigor(value));
  };

  return (
    <FlexGroup
      vertical
    >
      <Header>
        Stats
      </Header>
      <StatsContainer>
        <Stat>
          <StatName>
            ARC
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  onChange={handleArcChange}
                  value={arc}
                />
              ) : arc}
            </StatContainer>
          </StatInput>
        </Stat>
        <Stat>
          <StatName>
            DEX
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  onChange={handleDexChange}
                  value={dex}
                />
              ) : dex}
            </StatContainer>
          </StatInput>
        </Stat>
        <Stat>
          <StatName>
            END
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  onChange={handleEndChange}
                  value={end}
                />
              ) : end}
            </StatContainer>
          </StatInput>
        </Stat>
        <Stat>
          <StatName>
            FAI
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  onChange={handleFaiChange}
                  value={fai}
                />
              ) : fai}
            </StatContainer>
          </StatInput>
        </Stat>
        <Stat>
          <StatName>
            INT
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  onChange={handleIntChange}
                  value={int}
                />
              ) : int}
            </StatContainer>
          </StatInput>
        </Stat>
        <Stat>
          <StatName>
            MIN
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  onChange={handleMindChange}
                  value={mind}
                />
              ) : mind}
            </StatContainer>
          </StatInput>
        </Stat>
        <Stat>
          <StatName>
            STR
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  onChange={handleStrChange}
                  value={str}
                />
              ) : str}
            </StatContainer>
          </StatInput>
        </Stat>
        <Stat>
          <StatName>
            VIG
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  onChange={handleVigorChange}
                  value={vigor}
                />
              ) : vigor}
            </StatContainer>
          </StatInput>
        </Stat>
      </StatsContainer>
    </FlexGroup>
  );
}

const Header = styled.h2`
  margin-bottom: 20px;
`;

const StatsContainer = styled(FlexGroup)`
  flex-wrap: wrap;
`;

const Stat = styled(FlexGroup)`
  align-items: center;
  margin-bottom: 15px;
  margin-right: 30px;
`;

const StatName = styled.span`
  font-size: 12px;
  margin-right: 10px;
`;

const StatInput = styled(FlexGroup)`
  max-width: 40px;
  width: 40px;
`;

const StatContainer = styled.span`
  font-weight: bold;
`;

StatEditor.propTypes = {
  editable: PropTypes.bool.isRequired,
};

export default StatEditor;
