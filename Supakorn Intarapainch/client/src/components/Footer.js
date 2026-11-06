import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          <div>
            <div className="footer-brand">🔍 Lost &amp; Found</div>
            <p className="footer-text mb-0">ชุมชนช่วยกันตามหาของมีค่า ลงประกาศฟรี ไม่มีค่าใช้จ่าย</p>
          </div>
          <div className="footer-links">
            <Link to="/">หน้าแรก</Link>
            <Link to="/createPost">ลงประกาศ</Link>
            <Link to="/inbox">กล่องข้อความ</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>พัฒนาโดย ทีมพัฒนา Lost &amp; Found</span>
          <span>© {year} Lost &amp; Found — สงวนลิขสิทธิ์</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
