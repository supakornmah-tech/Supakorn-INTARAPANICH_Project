import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../utils/ui';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username, email, password
      });
      toast.success(response.data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
            ✨
          </div>
          <h2>สร้างบัญชีผู้ใช้</h2>
          <p>สมัครสมาชิกเพื่อเริ่มใช้งาน</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">ชื่อผู้ใช้งาน</label>
            <input
              type="text"
              className="form-control"
              placeholder="ชื่อของคุณ"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">อีเมล</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label">รหัสผ่าน</label>
            <input
              type="password"
              className="form-control"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn auth-btn w-100 text-white"
            disabled={loading}
          >
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: 0 }} />
                กำลังสมัคร...
              </span>
            ) : 'สมัครสมาชิก'}
          </button>
        </form>
        <div className="auth-footer">
          มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
