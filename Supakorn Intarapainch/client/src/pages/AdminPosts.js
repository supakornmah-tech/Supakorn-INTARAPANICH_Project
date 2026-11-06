import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';
import Pagination from '../components/Pagination';
import { toast, confirmDialog, reasonDialog } from '../utils/ui';
import { getCloseActionLabel, getStatusBadgeClass, getStatusLabel } from '../utils/labels';

const PAGE_SIZE = 10;
const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function AdminPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [page, setPage] = useState(1);

    useEffect(() => { fetchPosts(); }, []);
    useEffect(() => { setPage(1); }, [searchTerm, typeFilter, year, month, day, sortOrder]);

    const fetchPosts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/posts');
            setPosts(res.data);
        } catch (err) {
            console.error("โหลดข้อมูลโพสต์ล้มเหลว", err);
        } finally { setLoading(false); }
    };

    const handleDelete = async (post) => {
        const isResolved = post.status === 'resolved';
        const reason = await reasonDialog({
            title: isResolved ? 'ลบโพสต์ที่ปิดแล้ว' : 'ลบโพสต์ถาวร',
            message: isResolved
                ? `โพสต์ "${post.title}" ปิดแล้ว แต่แอดมินสามารถลบถาวรเพื่อล้างข้อมูลได้ เหตุผลจะถูกบันทึกในประวัติผู้ดูแลระบบ`
                : `ลบโพสต์ "${post.title}" ถาวรหรือไม่? เหตุผลจะถูกบันทึกในประวัติผู้ดูแลระบบ`,
            placeholder: 'เช่น สแปม, เนื้อหาไม่เหมาะสม, ข้อมูลเท็จ',
            confirmText: 'ลบถาวร',
        });
        if (reason === null) return;

        try {
            await axios.delete(`http://localhost:5000/api/admin/posts/${post.id}`, { data: { reason } });
            fetchPosts();
            toast.success('ลบโพสต์เรียบร้อยแล้ว');
        } catch (err) {
            toast.error(err.response?.data?.message || "ไม่สามารถลบโพสต์ได้");
        }
    };

    const toggleStatus = async (post) => {
        const ok = await confirmDialog({
            title: 'ยืนยันการปิดประกาศ',
            message: 'คุณแน่ใจหรือไม่ว่าประกาศนี้ดำเนินการเสร็จแล้ว? หลังปิดประกาศ เจ้าของจะแก้ไขหรือลบไม่ได้ แต่แอดมินยังลบถาวรได้จากหน้านี้',
            confirmText: 'ยืนยัน',
        });
        if (!ok) return;
        try {
            await axios.put(`http://localhost:5000/api/admin/posts/status/${post.id}`, { status: 'resolved' });
            fetchPosts();
            toast.success('อัปเดตสถานะเรียบร้อยแล้ว');
        } catch (err) {
            toast.error(err.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้");
        }
    };

    const years = [...new Set(
        posts
            .map(post => new Date(post.created_at))
            .filter(date => !Number.isNaN(date.getTime()))
            .map(date => date.getFullYear())
    )].sort((a, b) => b - a);

    const filteredPosts = posts.filter(post => {
        const text = searchTerm.toLowerCase();
        const matchesSearch = (post.title || '').toLowerCase().includes(text) ||
            (post.username || '').toLowerCase().includes(text) ||
            (post.description || '').toLowerCase().includes(text);
        const matchesType = typeFilter === 'all' || post.type === typeFilter;

        const created = new Date(post.created_at);
        const validDate = !Number.isNaN(created.getTime());
        const matchesYear = !year || (validDate && created.getFullYear() === Number(year));
        const matchesMonth = !month || (validDate && created.getMonth() + 1 === Number(month));
        const matchesDay = !day || (validDate && created.getDate() === Number(day));

        return matchesSearch && matchesType && matchesYear && matchesMonth && matchesDay;
    }).sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? diff : -diff;
    });

    const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
    const pagePosts = filteredPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const hasFilters = searchTerm || typeFilter !== 'all' || year || month || day;

    const resetFilters = () => {
        setSearchTerm('');
        setTypeFilter('all');
        setYear('');
        setMonth('');
        setDay('');
        setSortOrder('desc');
    };

    if (loading) return (
        <div className="admin-page">
            <AdminNav />
            <div className="container mt-5 text-center">
                <div className="loading-spinner"></div>
            </div>
        </div>
    );

    return (
        <div className="admin-page">
            <AdminNav />
            <div className="container mt-4 fade-in">
                <div className="admin-page-header mb-4">
                    <div>
                        <h3 className="fw-bold mb-1">📋 จัดการโพสต์ทั้งหมด</h3>
                        <p className="text-muted mb-0">จัดการประกาศทั้งหมดในระบบ</p>
                    </div>
                    <span className="badge bg-dark fs-6 px-3 py-2">ทั้งหมด {posts.length} รายการ</span>
                </div>

                <div className="type-tabs mb-3">
                    <button
                        type="button"
                        className={`type-tab ${typeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTypeFilter('all')}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        type="button"
                        className={`type-tab lost ${typeFilter === 'lost' ? 'active' : ''}`}
                        onClick={() => setTypeFilter('lost')}
                    >
                        🔴 หมวดของหาย
                    </button>
                    <button
                        type="button"
                        className={`type-tab found ${typeFilter === 'found' ? 'active' : ''}`}
                        onClick={() => setTypeFilter('found')}
                    >
                        🟢 หมวดพบของ
                    </button>
                </div>

                <div className="filter-bar mb-3">
                    <div className="filter-group filter-search">
                        <label htmlFor="admin-post-search">ค้นหา</label>
                        <input
                            id="admin-post-search"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="ชื่อโพสต์, รายละเอียด หรือผู้โพสต์..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="admin-post-year">ปี</label>
                        <select id="admin-post-year" className="form-select form-select-sm" value={year} onChange={(e) => setYear(e.target.value)}>
                            <option value="">ทุกปี</option>
                            {years.map(item => <option key={item} value={item}>{item + 543}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="admin-post-month">เดือน</label>
                        <select id="admin-post-month" className="form-select form-select-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
                            <option value="">ทุกเดือน</option>
                            {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="admin-post-day">วัน</label>
                        <select id="admin-post-day" className="form-select form-select-sm" value={day} onChange={(e) => setDay(e.target.value)}>
                            <option value="">ทุกวัน</option>
                            {Array.from({ length: 31 }, (_, index) => index + 1).map(item => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="admin-post-sort">เรียงลำดับ</label>
                        <select id="admin-post-sort" className="form-select form-select-sm" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
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

                <div className="card shadow-sm border-0">
                    <div className="table-responsive">
                        <table className="table admin-table mb-0">
                            <thead>
                                <tr>
                                    <th className="ps-4">รูป</th>
                                    <th>หัวข้อ</th>
                                    <th>ผู้โพสต์</th>
                                    <th>ประเภท</th>
                                    <th>สถานะ</th>
                                    <th>วันที่</th>
                                    <th className="text-end pe-4">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagePosts.map(p => (
                                    <tr key={p.id}>
                                        <td className="ps-4">
                                            {p.image_url ? (
                                                <img src={`http://localhost:5000${p.image_url}`} alt="post"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                                            ) : (
                                                <div className="bg-light d-flex align-items-center justify-content-center"
                                                    style={{ width: '50px', height: '50px', borderRadius: '8px', fontSize: '1.2rem' }}>
                                                    📷
                                                </div>
                                            )}
                                        </td>
                                        <td className="fw-bold">{p.title}</td>
                                        <td>{p.username || <span className="text-muted">ไม่ทราบชื่อ</span>}</td>
                                        <td>
                                            <span className={`badge ${p.type === 'lost' ? 'bg-danger' : 'bg-success'}`}>
                                                {p.type === 'lost' ? 'ของหาย' : 'พบของ'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(p.status)}`}>
                                                {getStatusLabel(p.type, p.status)}
                                            </span>
                                        </td>
                                        <td className="small text-muted text-nowrap">
                                            {new Date(p.created_at).toLocaleDateString('th-TH')}
                                        </td>
                                        <td className="text-end pe-4 text-nowrap">
                                            {p.status !== 'resolved' ? (
                                                <>
                                                    <button className="btn btn-sm btn-outline-success me-1 text-nowrap"
                                                        title="ทำเครื่องหมายว่าประกาศนี้ดำเนินการเสร็จแล้ว"
                                                        onClick={() => toggleStatus(p)}>
                                                        {getCloseActionLabel(p.type)}
                                                    </button>
                                                    <button className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(p)}>
                                                        🗑️ ลบ
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="d-inline-flex align-items-center gap-1">
                                                    <span className="badge bg-secondary px-3 py-2">🔒 {getStatusLabel(p.type, p.status)}</span>
                                                    <button className="btn btn-sm btn-outline-danger text-nowrap"
                                                        title="ลบถาวร (เฉพาะแอดมิน)"
                                                        onClick={() => handleDelete(p)}>
                                                        🗑️ ลบถาวร
                                                    </button>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {pagePosts.length === 0 && (
                                    <tr><td colSpan="7" className="text-center py-5 text-muted">ไม่พบข้อมูลประกาศ</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onChange={setPage}
                    totalItems={filteredPosts.length}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
}

export default AdminPosts;
