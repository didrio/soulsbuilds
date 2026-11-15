// Load/save state of the build page: which build (`/build/:buildId`, or 'new'), its non-slot fields
// (name, description, tags, likes, comments), owner, edit mode, and save.
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { customAlphabet } from 'nanoid';
import type { User as AuthUser } from 'firebase/auth';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { compact } from '@/lib/array';
import { getBuild, getUser, saveBuild } from '@/lib/firebase';
import type { BuildComment, BuildDoc, User } from '@/lib/models';
import { clearEditor, loadBuild, selectBuildFields } from './store/build';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

/** useAuth's value: null while unknown, false when signed out. */
export type AuthState = AuthUser | null | false;

export function useBuildEditor(auth: AuthState) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [editable, setEditable] = useState(false);
  const [comments, setComments] = useState<BuildComment[]>([]);
  const [buildUser, setBuildUser] = useState<Partial<User> | false>({});
  const [userOwnsBuild, setUserOwnsBuild] = useState(false);

  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const buildFields = useAppSelector(selectBuildFields);

  const clearState = useCallback(() => {
    dispatch(clearEditor());
  }, [dispatch]);

  useEffect(() => {
    clearState();
  }, [dispatch, clearState]);

  // Races auth: ownership is checked once, with whatever auth is at load time (T4).
  useEffect(() => {
    const savedBuildId = params?.buildId ?? 'new';
    setBuildId(savedBuildId);
    if (savedBuildId === 'new' && auth) {
      setEditable(true);
    } else if (savedBuildId === 'new' && auth === false) {
      navigate('/');
    }
  }, [params, auth, navigate]);

  useEffect(() => {
    if (buildId !== null && buildId !== 'new' && loading) {
      clearState();
      const run = async () => {
        const data = await getBuild(buildId);
        if (data) {
          const {
            user,
            name: savedName,
            description: savedDescription,
            tags: savedTags = [],
            likes: savedLikes = 0,
            comments: savedComments = [],
          } = data;
          if (auth && user === auth.uid) {
            setUserOwnsBuild(true);
          }
          setName(savedName);
          setDescription(savedDescription);
          setTags(savedTags);
          setLikes(savedLikes);
          setComments(savedComments);
          dispatch(loadBuild(data));
          const result = await getUser(user);
          setBuildUser(result);
        }
        setLoading(false);
      };
      run();
    } else if (buildId === 'new') {
      setLoading(false);
    }
  }, [buildId, dispatch, loading, auth, clearState]);

  // Always writes likes: 0 and comments: [], so editing resets them (T3).
  const handleSave = async () => {
    if (!auth) return;
    setSaveLoading(true);
    const build: BuildDoc = {
      user: auth.uid,
      name,
      description,
      tags,
      likes: 0,
      comments: [],
      ...buildFields,
    };
    const newId = nanoid();
    if (auth?.uid) {
      const { success, savedBuildId } = await saveBuild(buildId, build, newId, auth.uid);
      if (success && savedBuildId) {
        setBuildId(savedBuildId);
        setLoading(true);
        navigate(`/build/${savedBuildId}`);
      }
    }
    setEditable(false);
    setSaveLoading(false);
  };

  const handleAddTag = (tag: string) => {
    setTags((prevTags) => compact([...prevTags, tag]));
  };

  const handleRemoveTag = (value: string) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== value));
  };

  const handleEdit = () => {
    setEditable(true);
  };

  return {
    buildId,
    buildUser,
    comments,
    description,
    editable,
    likes,
    loading,
    name,
    saveLoading,
    tags,
    userOwnsBuild,
    setDescription,
    setLikes,
    setName,
    handleAddTag,
    handleEdit,
    handleRemoveTag,
    handleSave,
  };
}
