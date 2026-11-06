import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

const ACTION_META = {
    close_post: { label: 'ปิดประกาศ', className: 'bg-primary' },
    delete_post: { label: 'ลบประกาศ', className: 'bg-danger' },
    ban_user: { label: 'แบนผู้ใช้', className: 'bg-danger' },
    unban_user: { label: 'ปลดแบนผู้ใช้', className: 'bg-success' },
    change_role: { label: 'เปลี่ยนสิทธิ์', className: 'bg-warning text-dark' },
};

function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/admin/logs?limit=500');
                setLogs(res.data);
            } catch (err) {
                console.error('โหลดประวัติผู้ดูแลระบบล้มเหลว', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    useEffect(() => { setPage(1); }, [searchTerm, actionFilter]);

    const filteredLogs = logs.filter(log => {
        const text = searchTerm.toLowerCase();
        const matchesSearch = (log.admin_name || '').toLowerCase().includes(text) ||
            (log.detail || '').toLowerCase().includes(text);
        const matchesAction = actionFilter === 'all' || log.action === actionFilter;
        return matchesSearch && matchesAction;
    });

    const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
    const pageLogs = filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
                        <h3 className="fw-bold mb-1">🧾 ประวัติการทำงานของผู้ดูแล</h3>
                        <p className="text-muted mb-0">ตรวจสอบว่าแอดมินคนใดเปลี่ยนสถานะ แบน หรือลบข้อมูล</p>
                    </div>
                    <span className="badge bg-dark fs-6 px-3 py-2">ทั้งหมด {logs.length} รายการ</span>
                </div>

                <div className="filter-bar mb-3">
                    <div className="filter-group filter-search">
                        <label htmlFor="log-search">ค้นหา</label>
                        <input
                            id="log-search"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="ค้นหาชื่อแอดมินหรือรายละเอียด..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="log-action">ประเภทการกระทำ</label>
                        <select id="log-action" className="form-select form-select-sm" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                            <option value="all">ทั้งหมด</option>
                            {Object.entries(ACTION_META).map(([key, meta]) => (
                                <option key={key} value={key}>{meta.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="card shadow-sm border-0">
                    <div className="table-responsive">
                        <table className="table admin-table mb-0">
                            <thead>
                                <tr>
                                    <th className="ps-4">เวลา</th>
                                    <th>ผู้ดูแล</th>
                                    <th>การกระทำ</th>
                                    <th>เป้าหมาย</th>
                                    <th className="pe-4">รายละเอียด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageLogs.map(log => {
                                    const meta = ACTION_META[log.action] || { label: log.action, className: 'bg-secondary' };
                                    return (
                                        <tr key={log.id}>
                                            <td className="ps-4 small text-muted text-nowrap">
                                                {new Date(log.created_at).toLocaleString('th-TH')}
                                            </td>
                                            <td className="fw-bold">{log.admin_name || 'ไม่ทราบชื่อ'}</td>
                                            <td>
                                                <span className={`badge ${meta.className}`}>{meta.label}</span>
                                            </td>
                                            <td className="small text-nowrap">
                                                {log.target_type === 'post' ? 'ประกาศ' : 'ผู้ใช้'} #{log.target_id}
                                            </td>
                                            <td className="small pe-4">{log.detail || '-'}</td>
                                        </tr>
                                    );
                                })}
                                {pageLogs.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">ยังไม่มีประวัติการทำงาน</td>
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
                    totalItems={filteredLogs.length}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
}

export default AdminLogs;
