import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import PageHead from '@/components/ui/PageHead';
import PageMessage from '@/components/ui/PageMessage';
import Landing from '@/features/builds/Landing';
import { pageTitle } from '@/lib/share';
import NotFound from './NotFound';

// The landing page ships in the main bundle; the others load on first visit.
const BuildEditorPage = lazy(() => import('@/features/editor/BuildEditorPage'));
const Profile = lazy(() => import('@/features/profile/Profile'));
const AccountPage = lazy(() => import('@/features/account/AccountPage'));
const ActionPage = lazy(() => import('@/features/auth/action/ActionPage'));
const Privacy = lazy(() => import('@/features/legal/Privacy'));
const Terms = lazy(() => import('@/features/legal/Terms'));
const WeaponPage = lazy(() => import('@/features/hubs/WeaponPage'));
const TagPage = lazy(() => import('@/features/hubs/TagPage'));

/** The route table. */
function AppRoutes() {
  return (
    <Suspense fallback={<PageMessage loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/build/:buildId/*" element={<BuildEditorPage />} />
        <Route path="/user/:userId" element={<Profile />} />
        <Route path="/weapons/:slug" element={<WeaponPage />} />
        <Route path="/tags/:slug" element={<TagPage />} />
        <Route
          path="/account"
          element={
            <>
              <PageHead title={pageTitle('Your account')} noindex />
              <AccountPage />
            </>
          }
        />
        <Route
          path="/auth/action"
          element={
            <>
              <PageHead title={pageTitle('Account link')} noindex />
              <ActionPage />
            </>
          }
        />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
