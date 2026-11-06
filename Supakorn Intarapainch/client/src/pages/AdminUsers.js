import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';
import Pagination from '../components/Pagination';
import { toast, confirmDialog, reasonDialog } from '../utils/ui';

const PAGE_SIZE = 10;
const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const ROLE_LABELS = {
    user: 'USER',
    admin: 'ADMIN',
    superadmin: 'SUPER ADMIN',
};

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [page, setPage] = useState(1);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser?.id || currentUser?.user_id;

    useEffect(() => { fetchUsers(); }, []);
    useEffect(() => { setPage(1); }, [searchTerm, roleFilter, statusFilter, year, month]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("โหลดข้อมูลล้มเหลว", err);
        } finally { setLoading(false); }
    };

    const handleBan = async (user) => {
        if (user.is_banned) {
            const ok = await confirmDialog({
                title: 'ปลดแบนผู้ใช้',
                message: `ยืนยันการปลดแบน "${user.username}"?`,
                confirmText: 'ปลดแบน',
            });
            if (!ok) return;
            try {
                await axios.put(`http://localhost:5000/api/admin/users/ban/${user.id}`, { is_banned: 0 });
                fetchUsers();
                toast.success('ปลดแบนผู้ใช้เรียบร้อยแล้ว');
            } catch (err) {
                toast.error(err.response?.data?.message || "ไม่สามารถดำเนินการได้");
            }
            return;
        }

        const reason = await reasonDialog({
            title: 'แบนผู้ใช้',
            message: `ระบุเหตุผลในการแบน "${user.username}" ผู้ใช้จะเห็นเหตุผลนี้เมื่อพยายามเข้าสู่ระบบ`,
            placeholder: 'เช่น สแปม, เนื้อหาไม่เหมาะสม, ละเมิดข้อกำหนด',
            confirmText: 'แบนผู้ใช้',
        });
        if (reason === null) return;

        try {
            await axios.put(`http://localhost:5000/api/admin/users/ban/${user.id}`, {
                is_banned: 1,
                reason,
            });
            fetchUsers();
            toast.success('แบนผู้ใช้เรียบร้อยแล้ว');
        } catch (err) {
            toast.error(err.response?.data?.message || "ไม่สามารถดำเนินการได้");
        }
    };

    const handleRole = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        const ok = await confirmDialog({
            title: 'เปลี่ยนสิทธิ์ผู้ใช้',
            message: `เปลี่ยนสิทธิ์ของ "${user.username}" เป็น ${ROLE_LABELS[newRole]}?`,
            confirmText: 'เปลี่ยนสิทธิ์',
        });
        if (!ok) return;
        try {
            await axios.put(`http://localhost:5000/api/admin/users/role/${user.id}`, { role: newRole });
            fetchUsers();
            toast.success(`เปลี่ยนสิทธิ์เป็น ${ROLE_LABELS[newRole]} เรียบร้อยแล้ว`);
        } catch (err) {
            toast.error(err.response?.data?.message || "ไม่สามารถเปลี่ยนสิทธิ์ได้");
        }
    };

    const years = [...new Set(
        users
            .map(user => new Date(user.created_at))
            .filter(date => !Number.isNaN(date.getTime()))
            .map(date => date.getFullYear())
    )].sort((a, b) => b - a);

    const filteredUsers = users.filter(user => {
        const text = searchTerm.toLowerCase();
        const matchesSearch = (user.username || '').toLowerCase().includes(text) ||
            (user.email || '').toLowerCase().includes(text);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'banned' ? Number(user.is_banned) === 1 : Number(user.is_banned) !== 1);

        const created = new Date(user.created_at);
        const validDate = !Number.isNaN(created.getTime());
        const matchesYear = !year || (validDate && created.getFullYear() === Number(year));
        const matchesMonth = !month || (validDate && created.getMonth() + 1 === Number(month));

        return matchesSearch && matchesRole && matchesStatus && matchesYear && matchesMonth;
    });

    const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
    const pageUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const hasFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || year || month;

    const resetFilters = () => {
        setSearchTerm('');
        setRoleFilter('all');
        setStatusFilter('all');
        setYear('');
        setMonth('');
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
                        <h3 className="fw-bold mb-1">👥 จัดการผู้ใช้งาน</h3>
                        <p className="text-muted mb-0">จัดการบัญชีผู้ใช้ทั้งหมดในระบบ</p>
                    </div>
                    <span className="badge bg-dark fs-6 px-3 py-2">ทั้งหมด {users.length} บัญชี</span>
                </div>

                <div className="filter-bar mb-3">
                    <div className="filter-group filter-search">
                        <label htmlFor="admin-user-search">ค้นหา</label>
                        <input
                            id="admin-user-search"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="ค้นหาชื่อผู้ใช้หรืออีเมล..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="admin-user-role">บทบาท</label>
                        <select id="admin-user-role" className="form-select form-select-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="all">ทั้งหมด</option>
                            <option value="user">USER</option>
                            <option value="admin">ADMIN</option>
                            <option value="superadmin">SUPER ADMIN</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="admin-user-status">สถานะ</label>
                        <select id="admin-user-status" className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">ทั้งหมด</option>
                            <option value="active">ปกติ</option>
                            <option value="banned">ถูกระงับ</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="admin-user-year">ปีที่สมัคร</label>
                        <select id="admin-user-year" className="form-select form-select-sm" value={year} onChange={(e) => setYear(e.target.value)}>
                            <option value="">ทุกปี</option>
                            {years.map(item => <option key={item} value={item}>{item + 543}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="admin-user-month">เดือนที่สมัคร</label>
                        <select id="admin-user-month" className="form-select form-select-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
                            <option value="">ทุกเดือน</option>
                            {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
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
                                    <th className="ps-4">ชื่อผู้ใช้ / อีเมล</th>
                                    <th>บทบาท</th>
                                    <th>โพสต์</th>
                                    <th>สถานะ</th>
                                    <th>สมัครเมื่อ</th>
                                    <th className="text-end pe-4">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageUsers.map(u => {
                                    const isSelf = Number(u.id) === Number(currentUserId);
                                    const isProtected = u.role === 'superadmin';
                                    const canManageTarget = !isProtected && (u.role !== 'admin' || currentUser?.role === 'superadmin');
                                    return (
                                        <tr key={u.id} className="align-middle">
                                            <td className="ps-4">
                                                <div className="fw-bold">
                                                    {u.username}
                                                    {isSelf && <span className="badge bg-info ms-2">บัญชีของคุณ</span>}
                                                </div>
                                                <small className="text-muted">{u.email}</small>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.role === 'superadmin' ? 'bg-dark' : u.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                                                    {ROLE_LABELS[u.role] || 'USER'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="fw-medium">{u.post_count || 0} รายการ</span>
                                            </td>
                                            <td>
                                                {u.is_banned ? (
                                                    <div>
                                                        <span className="badge bg-secondary">🚫 ถูกระงับ</span>
                                                        {u.ban_reason && (
                                                            <div className="small text-muted mt-1 ban-reason">เหตุผล: {u.ban_reason}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-success">✅ ปกติ</span>
                                                )}
                                            </td>
                                            <td className="small text-muted text-nowrap">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString('th-TH') : '-'}
                                            </td>
                                            <td className="text-end pe-4 text-nowrap">
                                                {isSelf || !canManageTarget ? (
                                                    <span className="badge bg-secondary px-3 py-2">
                                                        {isProtected
                                                            ? '🔒 ป้องกันโดยระบบ'
                                                            : isSelf
                                                                ? 'ไม่สามารถแก้ไขตัวเอง'
                                                                : '🔒 Super Admin เท่านั้น'}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-dark me-1"
                                                            onClick={() => handleRole(u)}>
                                                            🔄 สิทธิ์
                                                        </button>
                                                        <button className={`btn btn-sm ${u.is_banned ? 'btn-success' : 'btn-danger'}`}
                                                            onClick={() => handleBan(u)}>
                                                            {u.is_banned ? '🔓 ปลดแบน' : '🚫 แบน'}
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pageUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted">ไม่พบข้อมูลผู้ใช้งาน</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onChange={setPage}
                    totalItems={filteredUsers.length}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
}

export default AdminUsers;
