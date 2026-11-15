import { Routes, Route } from 'react-router';
import Landing from '@/features/builds/Landing';
import BuildEditorPage from '@/features/editor/BuildEditorPage';
import Profile from '@/features/profile/Profile';
import NotFound from './NotFound';

/** The route table. */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/build/:buildId" element={<BuildEditorPage />} />
      <Route path="/user/:userId" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
