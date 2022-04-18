import { useState } from 'react';
import styled from 'styled-components';
import FlexItem from './common/FlexItem';
import FlexGroup from './common/FlexGroup';
import TextInput from './common/TextInput';
import EquipmentEditor from './EquipmentEditor';
import TearEditor from './TearEditor';
import SpellEditor from './SpellEditor';
import StatEditor from './StatEditor';

function BuildEditor() {
  const [name, setName] = useState('');

  const handleNameChange = (value) => {
    setName(value);
  };

  return (
    <FlexGroup
      vertical
    >
      <EditorContainer>
        <FlexItem
          basis="20%"
        >
          Build name:
        </FlexItem>
        <FlexItem
          basis="30%"
        >
          <TextInput
            onChange={handleNameChange}
            value={name}
          />
        </FlexItem>
      </EditorContainer>
      <EditorContainer>
        <StatEditor />
      </EditorContainer>
      <EditorContainer>
        <EquipmentEditor />
      </EditorContainer>
      <EditorContainer>
        <TearEditor />
      </EditorContainer>
      <EditorContainer>
        <SpellEditor />
      </EditorContainer>
    </FlexGroup>
  );
}

const EditorContainer = styled(FlexGroup)`
  margin-bottom: 50px;
`;

export default BuildEditor;
