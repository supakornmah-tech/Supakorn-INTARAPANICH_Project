import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { toast } from '../utils/ui';
import 'leaflet/dist/leaflet.css';
import '../utils/leaflet';

function MapFocus({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 16);
  }, [position, map]);
  return null;
}

function CreatePost() {
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user ? user.id : null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState('lost');
  const [image, setImage] = useState(null);
  const [position, setPosition] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการดึงตำแหน่ง');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (coords) => {
        setPosition([coords.coords.latitude, coords.coords.longitude]);
        setLocating(false);
        toast.success('ปักหมุดที่ตำแหน่งปัจจุบันแล้ว');
      },
      (error) => {
        setLocating(false);
        const denied = error.code === 1;
        toast.error(denied
          ? 'คุณไม่ได้อนุญาตให้เข้าถึงตำแหน่ง กรุณาอนุญาตแล้วลองใหม่'
          : 'ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาคลิกปักหมุดบนแผนที่แทน');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  function LocationPicker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });
    return position === null ? null : <Marker position={position} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { toast.info("กรุณาเข้าสู่ระบบก่อนลงประกาศครับ"); return; }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('contact', contact);
    formData.append('type', type);
    formData.append('image', image);
    formData.append('location_name', position ? 'พิกัดบนแผนที่' : 'ไม่ระบุตำแหน่ง');
    if (position) {
      formData.append('lat', position[0]);
      formData.append('lng', position[1]);
    }
    formData.append('user_id', userId);

    try {
      await axios.post('http://localhost:5000/api/posts/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("ลงประกาศสำเร็จ!");
      setTimeout(() => { window.location.href = '/'; }, 600);
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="fade-in">
        <h3 className="fw-bold mb-1">📢 ลงประกาศของหาย / พบของ</h3>
        <p className="text-muted mb-4">กรอกข้อมูลให้ครบถ้วนเพื่อเพิ่มโอกาสในการพบเจอ</p>
      </div>

      <form onSubmit={handleSubmit} className="row g-4 fade-in">
        <div className="col-md-5">
          <div className="card p-4 shadow-sm border-0">
            <div className="mb-3">
              <label className="form-label">🏷️ หัวข้อของที่หาย/พบ</label>
              <input type="text" className="form-control" placeholder="เช่น กุญแจรถ, หูฟัง, กระเป๋า..."
                onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="mb-3">
              <label className="form-label">📸 รูปภาพของ</label>
              <input type="file" className="form-control" accept="image/*"
                onChange={(e) => setImage(e.target.files[0])} />
              <small className="text-muted">เลือกรูปภาพเพื่อให้คนอื่นเห็นได้ง่ายขึ้น</small>
            </div>

            <div className="mb-3">
              <label className="form-label">📂 ประเภท</label>
              <div className="d-flex gap-2">
                <button type="button" className={`btn flex-grow-1 ${type === 'lost' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => setType('lost')}>🔴 ของหาย</button>
                <button type="button" className={`btn flex-grow-1 ${type === 'found' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setType('found')}>🟢 พบของ</button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">📞 ช่องทางติดต่อ</label>
              <input type="text" className="form-control" placeholder="เบอร์โทร / Line ID / Facebook"
                onChange={(e) => setContact(e.target.value)} required />
            </div>

            <div className="mb-3">
              <label className="form-label">📝 รายละเอียดเพิ่มเติม</label>
              <textarea className="form-control" rows="3" placeholder="บอกลักษณะเด่น สี จุดที่ทำหาย หรือข้อมูลสำคัญ"
                onChange={(e) => setDescription(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold py-2" disabled={submitting}>
              {submitting ? '⏳ กำลังลงประกาศ...' : '✅ ยืนยันการลงประกาศ'}
            </button>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card p-3 shadow-sm border-0 h-100">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
              <div>
                <div className="fw-medium">📍 ตำแหน่ง (ไม่บังคับ)</div>
                <small className="text-muted">ถ้าไม่รู้ว่าทำหายที่ไหน สามารถเว้นว่างได้</small>
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={locateMe} disabled={locating}>
                  {locating ? '⏳ กำลังหาตำแหน่ง...' : '📍 ใช้ตำแหน่งปัจจุบัน'}
                </button>
                {position && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setPosition(null)}>
                    ล้างหมุด
                  </button>
                )}
              </div>
            </div>
            {position ? (
              <div className="small text-success mb-2">
                ✅ พิกัด: {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </div>
            ) : (
              <div className="small text-muted mb-2">
                ไม่ระบุตำแหน่ง — ประกาศจะแสดงโดยไม่มีแผนที่
              </div>
            )}
            <div className="create-post-map">
              <MapContainer center={[17.290261, 104.108591]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker />
                <MapFocus position={position} />
              </MapContainer>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;
