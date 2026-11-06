import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';

function AdminStats() {
    const [stats, setStats] = useState({
        totalUsers: 0, lostCount: 0, foundCount: 0, resolvedCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/admin/stats-summary');
                setStats(res.data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally { setLoading(false); }
        };
        fetchStats();
    }, []);

    const totalPosts = stats.lostCount + stats.foundCount;
    const successRate = totalPosts > 0 ? ((stats.resolvedCount / totalPosts) * 100).toFixed(1) : 0;

    const cards = [
        {
            label: 'สมาชิกทั้งหมด',
            value: stats.totalUsers,
            unit: 'บัญชี',
            sub: 'จำนวนบัญชีผู้ใช้ที่สมัครในระบบ',
            color: 'var(--primary)',
        },
        {
            label: 'ประกาศของหาย',
            value: stats.lostCount,
            unit: 'รายการ',
            sub: 'ประกาศหมวดของหายทั้งหมด (รวมที่ปิดแล้ว)',
            color: 'var(--danger)',
        },
        {
            label: 'ประกาศพบของ',
            value: stats.foundCount,
            unit: 'รายการ',
            sub: 'ประกาศหมวดพบของทั้งหมด (รวมที่ปิดแล้ว)',
            color: 'var(--success)',
        },
        {
            label: 'ปิดประกาศแล้ว',
            value: stats.resolvedCount,
            unit: 'รายการ',
            sub: `จากทั้งหมด ${totalPosts} ประกาศ (${successRate}%)`,
            color: 'var(--resolved)',
        },
    ];

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
                <div className="mb-4">
                    <h3 className="fw-bold mb-1">สถิติภาพรวมระบบ</h3>
                    <p className="text-muted mb-0">
                        ตัวเลขแต่ละใบคือจำนวนรวมในระบบ ใช้ดูภาพรวมว่ามีผู้ใช้และประกาศประเภทใดบ้าง
                    </p>
                </div>

                <div className="row g-4 mb-5">
                    {cards.map((card) => (
                        <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
                            <div className="stat-tile" style={{ borderTopColor: card.color }}>
                                <div className="stat-tile-label">{card.label}</div>
                                <div className="stat-tile-value">
                                    {card.value}
                                    <span className="stat-tile-unit">{card.unit}</span>
                                </div>
                                <div className="stat-tile-sub">{card.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <h5 className="fw-bold mb-1">อัตราการปิดประกาศสำเร็จ</h5>
                        <p className="small text-muted mb-3">
                            คำนวณจากจำนวนประกาศที่ปิดแล้ว ÷ ประกาศทั้งหมด
                        </p>
                        <div className="progress-custom" role="progressbar" aria-valuenow={Number(successRate)} aria-valuemin="0" aria-valuemax="100">
                            <div className="progress-bar" style={{ width: `${Math.min(Number(successRate), 100)}%` }}></div>
                        </div>
                        <div className="d-flex justify-content-between mt-2 small text-muted">
                            <span>{successRate}% ของประกาศทั้งหมด</span>
                            <span>{stats.resolvedCount} / {totalPosts} ประกาศ</span>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="card shadow-sm border-0 p-4 h-100">
                            <h6 className="fw-bold mb-1">สรุปประเภทประกาศ</h6>
                            <p className="small text-muted mb-3">นับรวมประกาศที่ปิดแล้วทั้งสองประเภท</p>
                            <div className="d-flex justify-content-between mb-2">
                                <span>ของหาย</span>
                                <span className="fw-bold">{stats.lostCount} รายการ</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>พบของ</span>
                                <span className="fw-bold">{stats.foundCount} รายการ</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold">รวมทั้งหมด</span>
                                <span className="fw-bold">{totalPosts} รายการ</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card shadow-sm border-0 p-4 h-100">
                            <h6 className="fw-bold mb-1">สรุปผู้ใช้</h6>
                            <p className="small text-muted mb-3">จำนวนบัญชีและผลการดำเนินการในระบบ</p>
                            <div className="d-flex justify-content-between mb-2">
                                <span>ผู้ใช้ทั้งหมด</span>
                                <span className="fw-bold">{stats.totalUsers} บัญชี</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>ประกาศที่ปิดแล้ว</span>
                                <span className="fw-bold">{stats.resolvedCount} ประกาศ</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold">อัตราความสำเร็จ</span>
                                <span className="fw-bold" style={{ color: 'var(--success)' }}>{successRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminStats;
