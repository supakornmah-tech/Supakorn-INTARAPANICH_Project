import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function AdminNav() {
  const location = useLocation();

  const links = [
    { path: '/admin/users', label: '👥 จัดการผู้ใช้' },
    { path: '/admin/posts', label: '📋 จัดการโพสต์' },
    { path: '/admin/stats', label: '📊 สถิติระบบ' },
    { path: '/admin/logs', label: '🧾 ประวัติผู้ดูแล' },
  ];

  return (
    <div className="admin-nav shadow-sm">
      <div className="container">
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`admin-nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminNav;
