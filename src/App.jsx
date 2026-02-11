import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Debug from './pages/Debug';
import Upload from './pages/Upload';
import EditContent from './pages/EditContent';
import ContentDetail from './pages/ContentDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="profile" element={<Profile />} />
        <Route path="upload" element={<Upload />} />
        <Route path="edit-content/:id" element={<EditContent />} />
        <Route path="content/:id" element={<ContentDetail />} />
        <Route path="debug" element={<Debug />} />
      </Route>
    </Routes>
  );
}

export default App;
