import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { toast, confirmDialog } from '../utils/ui';
import { getCloseActionLabel, getStatusBadgeClass, getStatusLabel } from '../utils/labels';
import 'leaflet/dist/leaflet.css';
import '../utils/leaflet';

function MapFix() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function Profile() {
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user ? (user.id || user.user_id) : null;

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const [postsRes, meRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/posts/my-posts/${userId}`),
          axios.get('http://localhost:5000/api/auth/me'),
        ]);
        setMyPosts(postsRes.data);
        setProfile({ username: meRes.data.username || '', email: meRes.data.email || '' });
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...meRes.data }));
      } catch (err) {
        console.error("ดึงข้อมูลโปรไฟล์ล้มเหลว:", err);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [userId, navigate]);

  const handleToggleStatus = async (post) => {
    const ok = await confirmDialog({
      title: 'ยืนยันการปิดประกาศ',
      message: 'คุณแน่ใจหรือไม่ว่าประกาศนี้ดำเนินการเสร็จแล้ว? หลังปิดประกาศจะไม่สามารถแก้ไขหรือลบประกาศนี้ได้',
      confirmText: 'ยืนยัน',
    });
    if (!ok) return;

    try {
      await axios.put(`http://localhost:5000/api/posts/update-status/${post.id}`, { status: 'resolved' });
      setMyPosts(myPosts.map(item =>
        item.id === post.id ? { ...item, status: 'resolved' } : item
      ));
      toast.success('อัปเดตสถานะเรียบร้อยแล้ว');
    } catch (err) {
      toast.error(err.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmDialog({
      title: 'ลบประกาศ',
      message: 'คุณแน่ใจนะว่าจะลบประกาศนี้? การกระทำนี้ย้อนคืนไม่ได้',
      confirmText: 'ลบประกาศ',
      danger: true,
    });
    if (!ok) return;
    try {
      await axios.delete(`http://localhost:5000/api/posts/delete/${id}`);
      setMyPosts(myPosts.filter(post => post.id !== id));
      toast.success('ลบประกาศเรียบร้อยแล้ว');
    } catch (err) {
      toast.error(err.response?.data?.message || "ไม่สามารถลบได้");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', {
        username: profile.username,
        email: profile.email,
      });
      localStorage.setItem('user', JSON.stringify({ ...user, ...res.data.user }));
      toast.success('อัปเดตข้อมูลส่วนตัวสำเร็จ');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await axios.put('http://localhost:5000/api/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(res.data.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return (
    <div className="container mt-5 text-center">
      <div className="loading-spinner"></div>
      <p className="text-muted mt-2">กำลังโหลด...</p>
    </div>
  );

  return (
    <div className="container mt-4 pb-5 fade-in">
      <div className="profile-header mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h3>สวัสดีคุณ {profile.username || user?.username}</h3>
          <p>{profile.email || 'จัดการข้อมูลส่วนตัวและประกาศของคุณได้ที่นี่'}</p>
        </div>
        <Link to="/createPost" className="btn btn-light fw-bold px-4">
          + ลงประกาศใหม่
        </Link>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h6 className="fw-bold mb-3">👤 ข้อมูลส่วนตัว</h6>
            <form onSubmit={handleProfileSave}>
              <div className="mb-3">
                <label className="form-label">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  className="form-control"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">อีเมล</label>
                <input
                  type="email"
                  className="form-control"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary fw-bold" disabled={savingProfile}>
                {savingProfile ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h6 className="fw-bold mb-3">🔑 เปลี่ยนรหัสผ่าน</h6>
            <form onSubmit={handlePasswordChange}>
              <div className="mb-3">
                <label className="form-label">รหัสผ่านปัจจุบัน</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-sm-6">
                  <label className="form-label">รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    minLength={6}
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-outline-primary fw-bold" disabled={savingPassword}>
                {savingPassword ? '⏳ กำลังเปลี่ยน...' : '🔒 เปลี่ยนรหัสผ่าน'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table profile-table mb-0">
            <thead>
              <tr>
                <th>ข้อมูลของ</th>
                <th style={{ width: '220px' }}>ตำแหน่ง</th>
                <th>สถานะ</th>
                <th className="text-center" style={{ width: '240px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {myPosts.length > 0 ? myPosts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={post.image_url ? `http://localhost:5000${post.image_url}` : 'https://via.placeholder.com/60'}
                        alt="item"
                        className="rounded shadow-sm"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                      <div>
                        <div className="fw-bold" style={{ color: 'var(--primary)' }}>{post.title}</div>
                        <small className="text-muted">📞 {post.contact || 'ไม่ระบุ'}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {post.latitude && post.longitude ? (
                      <div style={{ height: '90px', width: '160px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <MapContainer center={[post.latitude, post.longitude]} zoom={15}
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom={false} dragging={false} zoomControl={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[post.latitude, post.longitude]} />
                          <MapFix />
                        </MapContainer>
                      </div>
                    ) : <span className="text-muted small">ไม่มีพิกัด</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(post.status)}`}>
                      {getStatusLabel(post.type, post.status)}
                    </span>
                  </td>
                  <td className="text-center">
                    {post.status !== 'resolved' ? (
                      <div className="d-flex gap-1 justify-content-center flex-wrap">
                        <button onClick={() => handleToggleStatus(post)}
                          className="btn btn-sm btn-success text-nowrap"
                          title="ทำเครื่องหมายว่าประกาศนี้ดำเนินการเสร็จแล้ว">
                          {getCloseActionLabel(post.type)}
                        </button>
                        <Link to={`/edit/${post.id}`} className="btn btn-sm btn-warning">✏️ แก้ไข</Link>
                        <button onClick={() => handleDelete(post.id)} className="btn btn-sm btn-danger">🗑️ ลบ</button>
                      </div>
                    ) : (
                      <span className="badge bg-secondary px-3 py-2">🔒 {getStatusLabel(post.type, post.status)}</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="text-center p-5 text-muted">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                  ยังไม่มีประกาศที่คุณลงไว้
                  <br />
                  <Link to="/createPost" className="btn btn-primary btn-sm mt-2">ลงประกาศแรกของคุณ</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Profile;
