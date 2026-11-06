import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import EditPost from './pages/EditPost';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatRoom from './pages/ChatRoom';
import ChatList from './pages/ChatList';
import AdminUsers from './pages/AdminUsers';
import AdminPosts from './pages/AdminPosts';
import AdminStats from './pages/AdminStats';
import AdminLogs from './pages/AdminLogs';
import { isAdminUser } from './utils/auth';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = isAdminUser(user);
  const forbidden = <div className="container mt-5 text-center"><h1>❌ ไม่มีสิทธิ์เข้าถึง</h1></div>;

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/createPost" element={<CreatePost />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit/:id" element={<EditPost />} />
            <Route path="/chat/:conversationId" element={<ChatRoom />} />
            <Route path="/inbox" element={<ChatList />} />
            <Route path="/admin/users" element={isAdmin ? <AdminUsers /> : forbidden} />
            <Route path="/admin/posts" element={isAdmin ? <AdminPosts /> : forbidden} />
            <Route path="/admin/stats" element={isAdmin ? <AdminStats /> : forbidden} />
            <Route path="/admin/logs" element={isAdmin ? <AdminLogs /> : forbidden} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
