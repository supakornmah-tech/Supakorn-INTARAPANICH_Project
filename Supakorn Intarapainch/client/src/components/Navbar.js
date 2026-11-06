import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { isAdminUser } from '../utils/auth';

function Navbar() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();

  const close = useCallback(() => setAdminOpen(false), []);

  useEffect(() => {
    if (!adminOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          toggleRef.current && !toggleRef.current.contains(e.target)) {
        close();
      }
    };
    const handleScroll = () => close();
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [adminOpen, close]);

  const handleToggle = () => {
    if (!adminOpen && toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        right: document.documentElement.clientWidth - rect.right,
        minWidth: 200,
      });
    }
    setAdminOpen(!adminOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-modern shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <span className="brand-mark">🔍</span> Lost &amp; Found
        </Link>

        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav ms-auto align-items-center gap-1">
            <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">หน้าแรก</Link>

            {user ? (
              <>
                <Link className={`nav-link ${location.pathname === '/createPost' ? 'active' : ''}`} to="/createPost">ลงประกาศ</Link>
                <Link className={`nav-link ${location.pathname === '/inbox' ? 'active' : ''}`} to="/inbox">📥 กล่องข้อความ</Link>

                {isAdminUser(user) && (
                  <div className="nav-item">
                    <span
                      ref={toggleRef}
                      className={`nav-link d-flex align-items-center gap-1 text-warning fw-bold ${adminOpen ? 'active' : ''}`}
                      onClick={handleToggle}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      ⚙️ จัดการระบบ ▾
                    </span>

                    {adminOpen && ReactDOM.createPortal(
                      <div
                        ref={menuRef}
                        onClick={() => setAdminOpen(false)}
                        className="admin-dropdown"
                        style={{ ...menuStyle, zIndex: 999999 }}
                      >
                        <Link className="admin-dropdown-item" to="/admin/users">👥 จัดการผู้ใช้</Link>
                        <Link className="admin-dropdown-item" to="/admin/posts">📋 จัดการโพสต์</Link>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0.5rem' }} />
                        <Link className="admin-dropdown-item" to="/admin/stats">📊 สถิติระบบ</Link>
                        <Link className="admin-dropdown-item" to="/admin/logs">🧾 ประวัติผู้ดูแล</Link>
                      </div>,
                      document.body
                    )}
                  </div>
                )}

                <Link className="nav-link d-flex align-items-center gap-1 text-info fw-bold" to="/profile">
                  👤 {user.username}
                  {user.role === 'superadmin' && <span className="badge bg-warning text-dark">SUPER</span>}
                </Link>

                <button className="btn btn-logout ms-lg-2" onClick={handleLogout}>
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`} to="/login">เข้าสู่ระบบ</Link>
                <Link className="nav-link btn btn-sm btn-post text-white px-3 ms-lg-2" to="/register">สมัครสมาชิก</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
