import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SectionHeading from '@/components/ui/SectionHeading';
import FormField from '@/features/auth/FormField';
import { AuthNotice } from '@/features/auth/styles';
import { useFieldErrors } from '@/features/auth/useFieldErrors';
import { useUpdateDisplayName } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import { LIMITS, type UserProfile } from '@/lib/models';
import { Section, SectionLead, SettingsForm } from './styles';

/** The public display name (moved from the profile's "Change name", T31). */
function DisplayNameSection({ profile }: { profile: UserProfile }) {
  const rename = useUpdateDisplayName(profile.id);
  const [name, setName] = useState(profile.displayName);
  const [saved, setSaved] = useState(false);
  const { errors, show, clear, ref, edit } = useFieldErrors(['name'] as const);
  const changed = name.trim() !== profile.displayName;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (rename.isPending) return;
    if (!name.trim()) {
      show({ name: 'Choose a name to show on your builds.' });
      return;
    }
    clear();
    setSaved(false);
    rename.mutate(name, {
      onSuccess: () => setSaved(true),
      onError: (error) => show({ form: errorMessage(error) }),
    });
  };

  return (
    <Section aria-labelledby="account-name">
      <SectionHeading id="account-name">Display name</SectionHeading>
      <SectionLead>Shown on your profile, your builds and your comments.</SectionLead>
      <SettingsForm onSubmit={handleSubmit} aria-label="Change display name" noValidate>
        <FormField
          id="account-display-name"
          label="Display name"
          ref={ref('name')}
          autoComplete="nickname"
          error={errors.name}
          maxLength={LIMITS.displayName}
          onChange={edit('name', (value) => {
            setName(value);
            setSaved(false);
          })}
          value={name}
        />
        <ErrorMessage>{errors.form}</ErrorMessage>
        {saved ? <AuthNotice role="status">Saved.</AuthNotice> : null}
        <Button type="submit" variant="secondary" disabled={!changed || rename.isPending}>
          {rename.isPending ? 'Saving…' : 'Save name'}
        </Button>
      </SettingsForm>
    </Section>
  );
}

export default DisplayNameSection;
