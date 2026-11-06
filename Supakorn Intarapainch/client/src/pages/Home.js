import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { toast, confirmDialog, reasonDialog } from '../utils/ui';
import { isAdminUser } from '../utils/auth';
import { getCloseActionLabel, getStatusBadgeClass, getStatusLabel } from '../utils/labels';
import MapModal from '../components/MapModal';
import Pagination from '../components/Pagination';
import 'leaflet/dist/leaflet.css';
import '../utils/leaflet';

const PAGE_SIZE = 12;
const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function Home() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [mapPost, setMapPost] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const currentUserId = user ? (user.id || user.user_id) : null;
  const isAdmin = isAdminUser(user);

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/posts/all');
      setPosts(res.data);
    } catch (err) {
      console.error("ดึงข้อมูลล้มเหลว", err);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm, activeTab, statusFilter, year, month, day, sortOrder]);

  const toggleStatus = async (id) => {
    const ok = await confirmDialog({
      title: 'ยืนยันการปิดประกาศ',
      message: 'คุณแน่ใจหรือไม่ว่าประกาศนี้ดำเนินการเสร็จแล้ว? หลังปิดประกาศ เจ้าของจะไม่สามารถแก้ไขหรือลบประกาศนี้ได้',
      confirmText: 'ยืนยัน',
    });
    if (!ok) return;
    try {
      await axios.put(`http://localhost:5000/api/posts/update-status/${id}`, { status: 'resolved' });
      fetchPosts();
      toast.success('อัปเดตสถานะเรียบร้อยแล้ว');
    } catch (err) {
      toast.error(err.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const handleDelete = async (id, post) => {
    let reason = null;

    if (isAdmin) {
      reason = await reasonDialog({
        title: 'ลบประกาศ',
        message: 'กรุณาระบุเหตุผลในการลบประกาศ เพื่อบันทึกไว้ในประวัติผู้ดูแลระบบ',
        placeholder: 'เช่น เนื้อหาไม่เหมาะสม, สแปม, ข้อมูลเท็จ',
        confirmText: 'ลบประกาศ',
      });
      if (reason === null) return;
    } else {
      const ok = await confirmDialog({
        title: 'ลบประกาศ',
        message: 'คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้? การกระทำนี้ย้อนคืนไม่ได้',
        confirmText: 'ลบประกาศ',
        danger: true,
      });
      if (!ok) return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/posts/delete/${id}`, {
        data: { reason }
      });
      setPosts(posts.filter(item => item.id !== id));
      toast.success('ลบประกาศเรียบร้อยแล้ว');
    } catch (err) {
      toast.error(err.response?.data?.message || "ลบไม่สำเร็จ");
    }
  };

  const handleContact = async (post) => {
    if (!user) {
      toast.info("กรุณาเข้าสู่ระบบก่อนทักแชท");
      return navigate('/login');
    }
    if (currentUserId === post.user_id) {
      toast.info("นี่คือโพสต์ของคุณเอง");
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/chat/get-or-create', {
        post_id: post.id,
        user_one: post.user_id,
        user_two: currentUserId
      });
      navigate(`/chat/${res.data.conversation_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "เปิดห้องแชทไม่สำเร็จ");
    }
  };

  const years = [...new Set(
    posts
      .map(post => new Date(post.created_at))
      .filter(date => !Number.isNaN(date.getTime()))
      .map(date => date.getFullYear())
  )].sort((a, b) => b - a);

  const filteredPosts = posts.filter((post) => {
    const text = searchTerm.toLowerCase();
    const matchesSearch = (post.title || '').toLowerCase().includes(text) ||
      (post.description || '').toLowerCase().includes(text) ||
      (post.contact || '').toLowerCase().includes(text);
    const matchesType = activeTab === 'all' || post.type === activeTab;
    const isResolved = post.status === 'resolved';
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'open' ? !isResolved : isResolved);

    const created = new Date(post.created_at);
    const validDate = !Number.isNaN(created.getTime());
    const matchesYear = !year || (validDate && created.getFullYear() === Number(year));
    const matchesMonth = !month || (validDate && created.getMonth() + 1 === Number(month));
    const matchesDay = !day || (validDate && created.getDate() === Number(day));

    return matchesSearch && matchesType && matchesStatus && matchesYear && matchesMonth && matchesDay;
  }).sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? diff : -diff;
  });

  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const pagePosts = filteredPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = searchTerm || activeTab !== 'all' || statusFilter !== 'open' || year || month || day;

  const resetFilters = () => {
    setSearchTerm('');
    setActiveTab('all');
    setStatusFilter('open');
    setYear('');
    setMonth('');
    setDay('');
    setSortOrder('desc');
  };

  return (
    <div className="container mt-4">
      <div className="home-hero fade-in">
        <h1>🔍 ค้นหา<span className="accent">ของหาย</span> & พบของ</h1>
        <p>ชุมชนช่วยกันตามหาของมีค่า ลงประกาศฟรี ไม่มีค่าใช้จ่าย</p>
      </div>

      <div className="search-box fade-in">
        <span className="search-icon">🔎</span>
        <input
          type="text"
          className="form-control"
          placeholder="ค้นหาชื่อของ รายละเอียด หรือช่องทางติดต่อ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="type-tabs mb-3 fade-in">
        <button
          type="button"
          className={`type-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          ทั้งหมด
        </button>
        <button
          type="button"
          className={`type-tab lost ${activeTab === 'lost' ? 'active' : ''}`}
          onClick={() => setActiveTab('lost')}
        >
          🔴 หมวดของหาย
        </button>
        <button
          type="button"
          className={`type-tab found ${activeTab === 'found' ? 'active' : ''}`}
          onClick={() => setActiveTab('found')}
        >
          🟢 หมวดพบของ
        </button>
      </div>

      <div className="filter-bar fade-in">
        <div className="filter-group">
          <label htmlFor="filter-status">สถานะประกาศ</label>
          <select id="filter-status" className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="open">ยังไม่ปิด</option>
            <option value="all">ทั้งหมด</option>
            <option value="closed">ปิดแล้ว</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-year">ปี</label>
          <select id="filter-year" className="form-select form-select-sm" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">ทุกปี</option>
            {years.map(item => <option key={item} value={item}>{item + 543}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-month">เดือน</label>
          <select id="filter-month" className="form-select form-select-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">ทุกเดือน</option>
            {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-day">วัน</label>
          <select id="filter-day" className="form-select form-select-sm" value={day} onChange={(e) => setDay(e.target.value)}>
            <option value="">ทุกวัน</option>
            {Array.from({ length: 31 }, (_, index) => index + 1).map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-sort">เรียงลำดับ</label>
          <select id="filter-sort" className="form-select form-select-sm" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">ใหม่สุดก่อน (DESC)</option>
            <option value="asc">เก่าสุดก่อน (ASC)</option>
          </select>
        </div>
        {hasFilters && (
          <button type="button" className="btn btn-sm btn-outline-secondary filter-reset" onClick={resetFilters}>
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="row g-4 stagger">
        {pagePosts.map((post) => {
          const isOwner = !!user && Number(currentUserId) === Number(post.user_id);
          const canManage = isOwner || isAdmin;
          const hasMap = post.latitude && post.longitude;
          const resolved = post.status === 'resolved';

          return (
            <div className="col-12 col-sm-6 col-lg-4" key={post.id}>
              <div className={`post-card card h-100 ${resolved ? 'is-resolved' : ''}`}>
                {post.image_url ? (
                  <div className="post-image-wrap">
                    <img
                      src={`http://localhost:5000${post.image_url}`}
                      className="card-img-top"
                      alt={post.title}
                    />
                  </div>
                ) : (
                  <div className="image-fallback">📷</div>
                )}

                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                    <div className="d-flex flex-wrap gap-1">
                      <span className={`post-type-badge ${post.type === 'lost' ? 'lost' : 'found'}`}>
                        {post.type === 'lost' ? 'ของหาย' : 'พบของ'}
                      </span>
                      <span className={`status-badge ${getStatusBadgeClass(post.status)}`}>
                        {getStatusLabel(post.type, post.status)}
                      </span>
                    </div>
                    <small className="text-muted text-nowrap">{new Date(post.created_at).toLocaleDateString('th-TH')}</small>
                  </div>

                  <h5 className="post-title fw-bold mb-1">
                    {post.title}
                    {resolved && <span className="ms-1">✅</span>}
                  </h5>

                  <p className="post-desc small mb-2 flex-grow-1">
                    {post.description && post.description.length > 80
                      ? post.description.substring(0, 80) + '...'
                      : post.description || 'ไม่มีรายละเอียด'}
                  </p>

                  {post.contact && (
                    <div className="mb-2 small">
                      <span style={{ color: 'var(--text-secondary)' }}>📞 ติดต่อ: </span>
                      <span className="fw-medium">{post.contact}</span>
                    </div>
                  )}

                  {hasMap ? (
                    <div
                      className="map-container post-map-click"
                      role="button"
                      tabIndex={0}
                      title="คลิกเพื่อขยายแผนที่"
                      onClick={() => setMapPost(post)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setMapPost(post);
                        }
                      }}
                    >
                      <MapContainer
                        center={[post.latitude, post.longitude]}
                        zoom={15}
                        style={{ height: '100%', width: '100%', pointerEvents: 'none' }}
                        zoomControl={false}
                        dragging={false}
                        scrollWheelZoom={false}
                        touchZoom={false}
                        doubleClickZoom={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[post.latitude, post.longitude]} />
                      </MapContainer>
                      <span className="map-expand-hint">⤢ คลิกเพื่อขยายแผนที่</span>
                    </div>
                  ) : (
                    <div className="map-container">
                      <div className="map-empty">ไม่มีตำแหน่ง</div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {canManage && !resolved && (
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-sm w-100 fw-bold btn-success"
                        title="ทำเครื่องหมายว่าประกาศนี้ดำเนินการเสร็จแล้ว"
                        onClick={() => toggleStatus(post.id)}
                      >
                        {getCloseActionLabel(post.type)}
                      </button>
                      <div className="d-flex gap-2">
                        <Link to={`/edit/${post.id}`} className="btn btn-sm btn-outline-warning flex-grow-1">✏️ แก้ไข</Link>
                        <button
                          onClick={() => handleDelete(post.id, post)}
                          className="btn btn-sm btn-outline-danger flex-grow-1"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    </div>
                  )}

                  {resolved && (
                    <span className="badge bg-secondary w-100 py-2 text-center d-block">
                      🔒 {getStatusLabel(post.type, post.status)}
                    </span>
                  )}

                  {!canManage && !resolved && (
                    <button className="btn btn-primary w-100 fw-bold" onClick={() => handleContact(post)}>
                      💬 ทักแชทสอบถาม
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="col-12">
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h5 className="fw-bold">
                {statusFilter === 'open' ? 'ไม่พบประกาศที่ยังไม่ปิด' : 'ไม่พบประกาศ'}
              </h5>
              <p>ไม่พบรายการที่คุณค้นหา ลองเปลี่ยนคำค้นหาหรือตัวกรองดูใหม่</p>
              {statusFilter === 'open' && (
                <button type="button" className="btn btn-outline-primary mt-2 me-2" onClick={() => setStatusFilter('all')}>
                  ดูประกาศทั้งหมด
                </button>
              )}
              {hasFilters && (
                <button type="button" className="btn btn-outline-secondary mt-2" onClick={resetFilters}>
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
              {!user && (
                <Link to="/login" className="btn btn-primary mt-2 ms-2">เข้าสู่ระบบเพื่อลงประกาศ</Link>
              )}
            </div>
          </div>
        )}
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onChange={setPage}
        totalItems={filteredPosts.length}
        pageSize={PAGE_SIZE}
      />

      <MapModal post={mapPost} onClose={() => setMapPost(null)} />
    </div>
  );
}

export default Home;
