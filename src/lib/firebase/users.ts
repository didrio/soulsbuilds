// users/{uid}: public profiles (display name). Email is only in Firebase Auth.
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentSnapshot,
} from 'firebase/firestore';
import type { UserDoc, UserProfile } from '@/lib/models';
import { firestore } from './app';

const userRef = (id: string) => doc(firestore, 'users', id);

function toUserProfile(snapshot: DocumentSnapshot): UserProfile {
  // Shape guaranteed by firestore.rules.
  const data = snapshot.data({ serverTimestamps: 'estimate' }) as UserDoc;
  return { id: snapshot.id, displayName: data.displayName, createdAt: data.createdAt.toDate() };
}

/** The profile, or null if there is no user with that id. */
export async function getUserProfile(id: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(userRef(id));
  return snapshot.exists() ? toUserProfile(snapshot) : null;
}

/** Profiles for several users at once, keyed by id (missing users are left out). */
export async function getUserProfiles(ids: string[]): Promise<Record<string, UserProfile>> {
  const profiles = await Promise.all([...new Set(ids)].map(getUserProfile));
  return Object.fromEntries(
    profiles.flatMap((profile) => (profile ? [[profile.id, profile]] : [])),
  );
}

/** Writes a new user's profile (signup). */
export async function createUserProfile(id: string, displayName: string): Promise<void> {
  await setDoc(userRef(id), { displayName: displayName.trim(), createdAt: serverTimestamp() });
}

export async function updateDisplayName(id: string, displayName: string): Promise<void> {
  await updateDoc(userRef(id), { displayName: displayName.trim() });
}
