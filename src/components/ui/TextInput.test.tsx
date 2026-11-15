import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TextInput from './TextInput';

describe('TextInput', () => {
  it('shows its placeholder and passes input props through', () => {
    render(
      <TextInput aria-label="Search items" onChange={() => {}} placeholder="Search" value="" />,
    );
    expect(screen.getByRole('textbox', { name: 'Search items' })).toHaveAttribute(
      'placeholder',
      'Search',
    );
  });
});
