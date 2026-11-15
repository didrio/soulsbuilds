// State of the build page: which build (or a new one), view vs edit, the name/description/tags
// draft, and save/cancel/delete. The slots (equipment, stats…) live in Redux (./store); server data
// comes from ./queries.
import { useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import useAuth from '@/features/auth/useAuth';
import { errorMessage } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import { useBuild, useDeleteBuild, useSaveBuild } from './queries';
import { clearEditor, loadBuild, selectBuildFields } from './store/build';

interface Draft {
  name: string;
  description: string;
  tags: string[];
}

const EMPTY_DRAFT: Draft = { name: '', description: '', tags: [] };

/** `buildId` is null for /build/new. Mount with `key={buildId}` so each build starts fresh. */
export function useBuildEditor(buildId: string | null) {
  const isNew = buildId === null;
  const auth = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const buildFields = useAppSelector(selectBuildFields);

  const buildQuery = useBuild(buildId);
  const build = buildQuery.data ?? null;
  const save = useSaveBuild(auth.uid);
  const remove = useDeleteBuild();

  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [validationError, setValidationError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isOwner = Boolean(build && auth.uid && build.ownerId === auth.uid);
  const editable = editing && (isNew ? Boolean(auth.uid) : isOwner);

  // The slots show the saved build whenever it (re)loads, except while the owner is editing.
  // A layout effect, so a cached build never flashes the previous build's slots.
  useLayoutEffect(() => {
    if (isNew) dispatch(clearEditor());
    else if (build && !editing) dispatch(loadBuild(build));
  }, [isNew, build, editing, dispatch]);

  const handleEdit = () => {
    if (!build) return;
    setDraft({ name: build.name, description: build.description, tags: build.tags });
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

  const handleSave = () => {
    if (!draft.name.trim()) {
      setValidationError('Give your build a name.');
      return;
    }
    setValidationError('');
    save.mutate(
      {
        buildId,
        input: {
          name: draft.name,
          description: draft.description,
          tags: draft.tags,
          stats: buildFields.stats,
          equipment: buildFields.equipment,
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

  const handleDelete = () => {
    if (!buildId) return;
    remove.mutate(buildId, {
      onSuccess: () => navigate(auth.uid ? `/user/${auth.uid}` : '/', { replace: true }),
    });
  };

  const setName = (name: string) => setDraft((d) => ({ ...d, name }));
  const setDescription = (description: string) => setDraft((d) => ({ ...d, description }));
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
    name: shown.name,
    description: shown.description,
    tags: shown.tags,
    saving: save.isPending,
    saveError: validationError || (save.error ? errorMessage(save.error) : ''),
    deleting: remove.isPending,
    deleteError: remove.error ? errorMessage(remove.error) : '',
    confirmingDelete,
    setConfirmingDelete,
    setName,
    setDescription,
    handleAddTag,
    handleRemoveTag,
    handleEdit,
    handleCancel,
    handleSave,
    handleDelete,
  };
}
