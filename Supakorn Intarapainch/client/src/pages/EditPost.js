import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '../utils/ui';

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/posts/get-post/${id}`);
        if (res.data.status === 'resolved') {
          toast.info('ประกาศนี้สิ้นสุดแล้ว ไม่สามารถแก้ไขได้');
          navigate('/profile');
          return;
        }
        setTitle(res.data.title);
        setDescription(res.data.description);
        setContact(res.data.contact);
      } catch (err) {
        toast.error("ดึงข้อมูลล้มเหลว");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`http://localhost:5000/api/posts/update/${id}`, { title, description, contact });
      toast.success("แก้ไขข้อมูลสำเร็จ!");
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="container mt-5 text-center">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="container mt-4 fade-in">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 p-4">
            <h3 className="fw-bold mb-1">✏️ แก้ไขประกาศ</h3>
            <p className="text-muted mb-4">แก้ไขข้อมูลประกาศ #{id}</p>
            <form onSubmit={handleUpdate}>
              <div className="mb-3">
                <label className="form-label">🏷️ หัวข้อ</label>
                <input type="text" className="form-control" value={title}
                  onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">📝 รายละเอียด</label>
                <textarea className="form-control" rows="3" value={description}
                  onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="form-label">📞 ช่องทางติดต่อ</label>
                <input type="text" className="form-control" value={contact}
                  onChange={(e) => setContact(e.target.value)} required />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-warning flex-grow-1 fw-bold" disabled={saving}>
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPost;
