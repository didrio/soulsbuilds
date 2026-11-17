import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import PageMessage from '@/components/ui/PageMessage';
import Landing from '@/features/builds/Landing';
import NotFound from './NotFound';

// The landing page ships in the main bundle; the others load on first visit.
const BuildEditorPage = lazy(() => import('@/features/editor/BuildEditorPage'));
const Profile = lazy(() => import('@/features/profile/Profile'));
const AccountPage = lazy(() => import('@/features/account/AccountPage'));
const ActionPage = lazy(() => import('@/features/auth/action/ActionPage'));
const Privacy = lazy(() => import('@/features/legal/Privacy'));
const Terms = lazy(() => import('@/features/legal/Terms'));

/** The route table. */
function AppRoutes() {
  return (
    <Suspense fallback={<PageMessage loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/build/:buildId/:tab?" element={<BuildEditorPage />} />
        <Route path="/user/:userId" element={<Profile />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/auth/action" element={<ActionPage />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
