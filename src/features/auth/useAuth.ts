import { use } from 'react';
import { AuthContext, type AuthValue } from './authContext';

/** The signed-in user (from AuthProvider): `{ loading, user, uid }`. */
export default function useAuth(): AuthValue {
  return use(AuthContext);
}
