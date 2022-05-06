import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import FlexGroup from './common/FlexGroup';
import TextInput from './common/TextInput';
import {
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

function StatEditor({ editable, level }) {
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
      <HeaderContainer>
        <Header>
          Stats
        </Header>
        <Level>
          Level
          {' '}
          {level}
        </Level>
      </HeaderContainer>
      <StatsContainer>
        <Stat>
          <StatName>
            ARC
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  centered
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
                  centered
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
                  centered
                  onChange={handleEndChange}
                  value={end}
                />
              ) : end}
            </StatContainer>
          </StatInput>
        </Stat>
        <StatNoMargin>
          <StatName>
            FAI
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  centered
                  onChange={handleFaiChange}
                  value={fai}
                />
              ) : fai}
            </StatContainer>
          </StatInput>
        </StatNoMargin>
      </StatsContainer>
      <StatsContainer>
        <Stat>
          <StatName>
            INT
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  centered
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
                  centered
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
                  centered
                  onChange={handleStrChange}
                  value={str}
                />
              ) : str}
            </StatContainer>
          </StatInput>
        </Stat>
        <StatNoMargin>
          <StatName>
            VIG
          </StatName>
          <StatInput>
            <StatContainer>
              {editable ? (
                <TextInput
                  centered
                  onChange={handleVigorChange}
                  value={vigor}
                />
              ) : vigor}
            </StatContainer>
          </StatInput>
        </StatNoMargin>
      </StatsContainer>
    </FlexGroup>
  );
}

const HeaderContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const Header = styled.h2`
  color: ${COLOR_LIGHTEST_GREEN};
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: normal;
`;

const Level = styled(FlexGroup)`
  margin-bottom: 20px;
  font-size: 20px;
`;

const StatsContainer = styled(FlexGroup)`
  flex-wrap: wrap;
`;

const Stat = styled(FlexGroup)`
  align-items: center;
  margin-bottom: 15px;
  margin-right: 30px;

  @media only screen and (max-width: 1400px) {
    margin-right: 20px;
  }

  @media only screen and (max-width: 1100px) {
    margin-right: 10px;
  }
`;

const StatNoMargin = styled(Stat)`
  margin-right: 0px;
`;

const StatName = styled.span`
  font-size: 12px;
  margin-right: 10px;
  width: 30px;

  @media only screen and (max-width: 1400px) {
    width: 20px;
  }

  @media only screen and (max-width: 1100px) {
    width: 20px;
    font-size: 10px;
  }
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
  level: PropTypes.string.isRequired,
};

export default StatEditor;
