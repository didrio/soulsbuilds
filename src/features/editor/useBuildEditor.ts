// State of the build page: which build (or a new one), view vs edit, the name/description/tags
// draft, and save/cancel/delete. The slots (equipment, stats…) live in Redux (./store); server data
// comes from ./queries.
import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useOpenAuthDialog } from '@/app/authDialog';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import useAuth from '@/features/auth/useAuth';
import { errorMessage } from '@/lib/firebase';
import { hasImageItem, imageChoices } from '@/lib/equipment';
import { countEvent } from '@/lib/usage';
import { LIMITS, type BuildImage } from '@/lib/models';
import { useBuild, useDeleteBuild, useSaveBuild } from './queries';
import { clearEditor, loadBuild, selectBuildFields } from './store/build';

interface Draft {
  name: string;
  description: string;
  tags: string[];
  /** The build image (T40): the author's pick, or null for the default. */
  image: BuildImage | null;
}

const EMPTY_DRAFT: Draft = { name: '', description: '', tags: [], image: null };

/** `buildId` is null for /build/new. Mount with `key={buildId}` so each build starts fresh. */
export function useBuildEditor(buildId: string | null) {
  const isNew = buildId === null;
  const auth = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const buildFields = useAppSelector(selectBuildFields);

  const buildQuery = useBuild(buildId);
  const build = buildQuery.data ?? null;
  const save = useSaveBuild();
  const openAuthDialog = useOpenAuthDialog();
  const remove = useDeleteBuild();

  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [validationError, setValidationError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isOwner = Boolean(build && auth.uid && build.ownerId === auth.uid);
  // A new build is editable signed out too (T68): planning needs no account, saving does.
  const editable = editing && (isNew || isOwner);
  const signedOutDraft = isNew && !auth.loading && !auth.uid;
  // Unsaved work worth a "leave the page?" warning: a name, a write-up, tags or any gear.
  const dirty =
    isNew &&
    (draft.name.trim() !== '' ||
      draft.description.trim() !== '' ||
      draft.tags.length > 0 ||
      imageChoices(buildFields.equipment).length > 0);

  useEffect(() => {
    if (signedOutDraft) countEvent('planner-opened-signed-out');
  }, [signedOutDraft]);

  // A new build lives only in this tab until it's saved: warn before a reload or close drops it.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // The slots show the saved build whenever it (re)loads, except while the owner is editing.
  // A layout effect, so a cached build never flashes the previous build's slots.
  useLayoutEffect(() => {
    if (isNew) dispatch(clearEditor());
    else if (build && !editing) dispatch(loadBuild(build));
  }, [isNew, build, editing, dispatch]);

  const handleEdit = () => {
    if (!build) return;
    setDraft({
      name: build.name,
      description: build.description,
      tags: build.tags,
      image: build.image,
    });
    setValidationError('');
    save.reset();
    setEditing(true);
  };

  const handleCancel = () => {
    if (isNew) {
      navigate(auth.uid ? `/user/${auth.uid}` : '/');
      return;
    }
    setEditing(false);
    setValidationError('');
  };

  const saveAs = (ownerId: string) => {
    save.mutate(
      {
        buildId,
        ownerId,
        input: {
          name: draft.name,
          description: draft.description,
          tags: draft.tags,
          stats: buildFields.stats,
          startingClass: buildFields.startingClass,
          equipment: buildFields.equipment,
          // A pick that's no longer on the build (removed or swapped while editing) saves as the default.
          image:
            draft.image && hasImageItem(buildFields.equipment, draft.image) ? draft.image : null,
        },
      },
      {
        onSuccess: (savedId) => {
          setEditing(false);
          if (isNew) navigate(`/build/${savedId}`, { replace: true });
        },
      },
    );
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      setValidationError('Give your build a name.');
      return;
    }
    setValidationError('');
    if (!auth.uid) {
      // Signed out (a new build only): sign up or log in, then save what's on the page (T68). The
      // dialog is modal, so the build can't change in between.
      openAuthDialog('signup', (uid) => {
        countEvent('signed-in-to-save');
        saveAs(uid);
      });
      return;
    }
    saveAs(auth.uid);
  };

  const handleDelete = () => {
    if (!buildId) return;
    remove.mutate(buildId, {
      onSuccess: () => navigate(auth.uid ? `/user/${auth.uid}` : '/', { replace: true }),
    });
  };

  const setName = (name: string) => setDraft((d) => ({ ...d, name }));
  const setDescription = (description: string) => setDraft((d) => ({ ...d, description }));
  const setImage = (image: BuildImage | null) => setDraft((d) => ({ ...d, image }));
  const handleAddTag = (tag: string) =>
    setDraft((d) =>
      d.tags.includes(tag) || d.tags.length >= LIMITS.tags ? d : { ...d, tags: [...d.tags, tag] },
    );
  const handleRemoveTag = (tag: string) =>
    setDraft((d) => ({ ...d, tags: d.tags.filter((t) => t !== tag) }));

  // What the page shows: the draft while editing, the saved build otherwise.
  const shown = editable || !build ? draft : build;

  return {
    auth,
    build,
    buildQuery,
    isNew,
    isOwner,
    editable,
    /** Planning a new build while signed out: Save asks for an account first (T68). */
    signedOutDraft,
    name: shown.name,
    description: shown.description,
    tags: shown.tags,
    /** The image draft while editing (view mode shows `build.image` through `buildImage`). */
    image: draft.image,
    equipment: buildFields.equipment,
    saving: save.isPending,
    saveError: validationError || (save.error ? errorMessage(save.error) : ''),
    deleting: remove.isPending,
    deleteError: remove.error ? errorMessage(remove.error) : '',
    confirmingDelete,
    setConfirmingDelete,
    setName,
    setDescription,
    setImage,
    handleAddTag,
    handleRemoveTag,
    handleEdit,
    handleCancel,
    handleSave,
    handleDelete,
  };
}
