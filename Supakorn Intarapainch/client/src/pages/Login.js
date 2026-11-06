import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../utils/ui';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      navigate('/');
      window.location.href = '/';
    } catch (err) {
      const message = err.response?.data?.message || 'เข้าสู่ระบบล้มเหลว';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
            🔍
          </div>
          <h2>ยินดีต้อนรับกลับ</h2>
          <p>เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>
        {errorMessage && (
          <div className="alert alert-danger py-2 px-3 small" role="alert">
            <strong>ไม่สามารถเข้าสู่ระบบได้</strong>
            <div>{errorMessage}</div>
          </div>
        )}
        <form onSubmit={handleLogin}>
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
              placeholder="••••••••"
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
                กำลังเข้าสู่ระบบ...
              </span>
            ) : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <div className="auth-footer">
          ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
