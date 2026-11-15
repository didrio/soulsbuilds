import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import PageMessage from '@/components/ui/PageMessage';
import Landing from '@/features/builds/Landing';
import NotFound from './NotFound';

// The landing page ships in the main bundle; the others load on first visit.
const BuildEditorPage = lazy(() => import('@/features/editor/BuildEditorPage'));
const Profile = lazy(() => import('@/features/profile/Profile'));

/** The route table. */
function AppRoutes() {
  return (
    <Suspense fallback={<PageMessage loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/build/:buildId" element={<BuildEditorPage />} />
        <Route path="/user/:userId" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
