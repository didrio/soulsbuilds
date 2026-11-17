import { useId, useState } from 'react';
import styled from 'styled-components';
import { tagGroups } from '@/data/core';
import {
  COLOR_INSET,
  COLOR_LINE_STRONG,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  RADIUS_FRAME,
  SHADOW_OVERLAY,
  TEXT_SM,
} from '@/theme';
import { opticalCenter } from './typography';
import Button from './Button';
import FocusScope from './FocusScope';
import { ChevronDownIcon, CloseIcon, PlusIcon } from './icons';
import { panel } from './inWorld';
import OutsideClickHandler from './OutsideClickHandler';
import TextInput from './TextInput';
import { labelText } from './typography';

interface ChipsProps {
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  values: string[];
  /** The add button's text (the landing says "More tags" next to its top tags). */
  addLabel?: string;
}

/**
 * Chosen tags as chips (each a "Remove <tag>" button), plus an "Add tag" button that opens a popover:
 * search all tags, or browse them by group (src/data/er/tags.json). Escape or a click outside closes it.
 */
function Chips({ onAdd, onRemove, values, addLabel = 'Add tag' }: ChipsProps) {
  const popoverId = useId();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const close = () => {
    setOpen(false);
    setOpenGroup(null);
    setSearchText('');
  };

  const add = (tag: string) => {
    onAdd(tag);
    close();
  };

  const available = (tags: readonly string[]) => tags.filter((tag) => !values.includes(tag));
  const query = searchText.trim().toLowerCase();
  const searchResults = available(Object.values(tagGroups).flat()).filter((tag) =>
    tag.toLowerCase().includes(query),
  );

  return (
    <Container>
      {values.map((value) => (
        <Chip
          key={value}
          type="button"
          aria-label={`Remove ${value}`}
          onClick={() => onRemove(value)}>
          {value}
          <CloseIcon size={14} />
        </Chip>
      ))}
      <OutsideClickHandler onOutsideClick={close}>
        <Anchor>
          <Button
            variant="secondary"
            aria-expanded={open}
            aria-controls={open ? popoverId : undefined}
            onClick={() => (open ? close() : setOpen(true))}>
            <PlusIcon />
            {addLabel}
          </Button>
          {open ? (
            <Popover id={popoverId} onEscape={close} role="group" aria-label="Add a tag">
              <TextInput
                aria-label="Search tags"
                onChange={setSearchText}
                placeholder="Search tags"
                type="search"
                value={searchText}
              />
              {query ? (
                <Options>
                  {searchResults.length ? (
                    searchResults.map((tag) => (
                      <li key={tag}>
                        <Option type="button" onClick={() => add(tag)}>
                          {tag}
                        </Option>
                      </li>
                    ))
                  ) : (
                    <Empty>No tags match.</Empty>
                  )}
                </Options>
              ) : (
                <Options>
                  {Object.entries(tagGroups).map(([group, tags]) => (
                    <li key={group}>
                      <GroupButton
                        type="button"
                        aria-expanded={openGroup === group}
                        onClick={() => setOpenGroup(openGroup === group ? null : group)}>
                        {group}
                        <ChevronDownIcon />
                      </GroupButton>
                      {openGroup === group ? (
                        <Options $nested>
                          {available(tags).map((tag) => (
                            <li key={tag}>
                              <Option type="button" onClick={() => add(tag)}>
                                {tag}
                              </Option>
                            </li>
                          ))}
                        </Options>
                      ) : null}
                    </li>
                  ))}
                </Options>
              )}
            </Popover>
          ) : null}
        </Anchor>
      </OutsideClickHandler>
    </Container>
  );
}

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled.button`
  align-items: center;
  background: ${COLOR_INSET};
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: inline-flex;
  font-size: ${TEXT_SM};
  font-weight: 500;
  gap: 6px;
  min-height: 36px;
  padding: 0 10px 0 12px;
  ${opticalCenter}

  & > svg {
    color: ${COLOR_TEXT_MUTED};
  }

  &:hover {
    border-color: ${COLOR_TEXT_MUTED};
  }

  &:hover > svg {
    color: ${COLOR_TEXT};
  }
`;

const Anchor = styled.div`
  position: relative;
`;

const Popover = styled(FocusScope)`
  ${panel}
  border-color: ${COLOR_LINE_STRONG};
  box-shadow: ${SHADOW_OVERLAY};
  display: flex;
  flex-direction: column;
  gap: 8px;
  left: 0;
  max-height: 380px;
  max-width: calc(100vw - 48px);
  outline: none;
  padding: 10px;
  position: absolute;
  top: calc(100% + 6px);
  width: 280px;
  z-index: 20;
`;

const Options = styled.ul<{ $nested?: boolean }>`
  list-style: none;
  margin: 0;
  overflow-y: auto;
  padding: ${({ $nested }) => ($nested ? '0 0 6px 12px' : '0')};
`;

const optionStyle = `
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  min-height: 40px;
  padding: 0 8px;
  text-align: left;
  width: 100%;
`;

const GroupButton = styled.button`
  ${optionStyle}
  ${labelText}

  &[aria-expanded='true'] > svg {
    transform: rotate(180deg);
  }

  &:hover {
    color: ${COLOR_TEXT};
  }
`;

const Option = styled.button`
  ${optionStyle}
  color: ${COLOR_TEXT};
  font-size: ${TEXT_SM};

  &:hover {
    background: ${COLOR_SURFACE_RAISED};
  }
`;

const Empty = styled.li`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  padding: 8px;
`;

export default Chips;
