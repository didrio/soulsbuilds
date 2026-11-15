import { Routes, Route } from 'react-router';
import Landing from '@/features/builds/Landing';
import BuildEditorPage from '@/features/editor/BuildEditorPage';
import Profile from '@/features/profile/Profile';

/** The route table. No 404 route yet (T6). */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/build/:buildId" element={<BuildEditorPage />} />
      <Route path="/user/:userId" element={<Profile />} />
    </Routes>
  );
}

export default AppRoutes;
