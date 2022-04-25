import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import OutsideClickHandler from 'react-outside-click-handler';
import flatten from 'lodash/flatten';
import TextInput from './TextInput';
import FlexGroup from './FlexGroup';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_LIGHTEST_GREEN,
} from '../../constants';
import tags from '../../data/tags.json';

function Chips({
  onAdd,
  onRemove,
  values,
}) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleShowDropdown = () => {
    setShowDropdown(true);
  };

  const handleHideDropdown = () => {
    setShowDropdown(false);
    setSelectedKey(null);
    setSearchText('');
  };

  const removeTag = (value) => () => {
    onRemove(value);
  };

  const handleSelectKey = (key) => () => {
    setSelectedKey((prevKey) => (
      prevKey === key ? null : key
    ));
  };

  const handleAddValue = (value) => () => {
    onAdd(value);
    handleHideDropdown();
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    setSelectedKey(null);
  };

  const searchResults = useMemo(() => (
    flatten(Object.values(tags)).filter((tag) => (
      tag.toLowerCase().includes(searchText)
    ))
  ), [searchText]);

  return (
    <Container>
      <ChipContainer>
        {values.map((value) => (
          <Chip
            key={value}
            onClick={removeTag(value)}
          >
            {value}
          </Chip>
        ))}
        <AddContainer>

          <Chip
            onClick={handleShowDropdown}
          >
            + Add Tag
          </Chip>
          {showDropdown ? (
            <OutsideClickHandler
              onOutsideClick={handleHideDropdown}
            >
              <Dropdown
                vertical
              >
                <SearchContainer>
                  <TextInput
                    onChange={handleSearchChange}
                    value={searchText}
                  />
                </SearchContainer>
                {searchText ? (
                  <ValuesContainer
                    vertical
                  >
                    {searchResults.map((value) => (
                      <ValueContainer
                        key={value}
                        onClick={handleAddValue(value)}
                      >
                        {value}
                      </ValueContainer>
                    ))}
                  </ValuesContainer>
                ) : (
                  <FlexGroup
                    vertical
                  >
                    {Object.keys(tags).map((key) => (
                      <FlexGroup
                        key={key}
                        vertical
                      >
                        <KeyContainer
                          key={key}
                          onClick={handleSelectKey(key)}
                        >
                          <FlexGroup>
                            {key}
                          </FlexGroup>
                          <Caret>
                            {selectedKey === key ? 'v' : '>'}
                          </Caret>
                        </KeyContainer>
                        {selectedKey === key ? (
                          <ValuesContainer
                            vertical
                          >
                            {Object.values(tags[key]).map((value) => (
                              <ValueContainer
                                key={value}
                                onClick={handleAddValue(value)}
                              >
                                {value}
                              </ValueContainer>
                            ))}
                          </ValuesContainer>
                        ) : null}
                      </FlexGroup>
                    ))}
                  </FlexGroup>
                )}
              </Dropdown>
            </OutsideClickHandler>
          ) : null}
        </AddContainer>
      </ChipContainer>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  max-width: 100%;
`;

const ChipContainer = styled(FlexGroup)`
  flex-wrap: wrap;
`;

const Chip = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  margin-top: 10px;
  height: 30px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  cursor: pointer;
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 14px;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

const AddContainer = styled(FlexGroup)`
  position: relative;
`;

const Dropdown = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  position: absolute;
  left: 75px;
  top: 10px;
  width: 250px;
  max-height: 400px;
  overflow-y: scroll;
  cursor: auto;
  padding: 5px 10px;
`;

const KeyContainer = styled(FlexGroup)`
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    color: ${COLOR_LIGHTEST_GREEN};
  }
`;

const Caret = styled(FlexGroup)`
  font-weight: bold;
  margin-left: 5px;
`;

const ValuesContainer = styled(FlexGroup)`
  margin-left: 20px;
  padding: 5px 0;
`;

const ValueContainer = styled(FlexGroup)`
  cursor: pointer;
  font-size: 16px;
  padding: 2px 0;

  &:hover {
    color: ${COLOR_LIGHTEST_GREEN};
  }
`;

const SearchContainer = styled(FlexGroup)`
  margin-bottom: 10px;
  margin-top: 5px;

  & > input {
    font-size: 16px;
    height: 30px;
  }
`;

Chips.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Chips;
