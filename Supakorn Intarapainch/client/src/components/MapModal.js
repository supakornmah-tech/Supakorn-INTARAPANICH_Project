import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { getStatusLabel, getTypeLabel } from '../utils/labels';
import 'leaflet/dist/leaflet.css';
import '../utils/leaflet';

function MapModal({ post, onClose }) {
  useEffect(() => {
    if (!post) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [post, onClose]);

  if (!post) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay map-modal-overlay show" onClick={onClose}>
      <div className="modal-card map-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <div>
            <div className="map-modal-title">{post.title}</div>
            <div className="map-modal-meta">
              <span className={`post-type-badge ${post.type === 'lost' ? 'lost' : 'found'}`}>
                {getTypeLabel(post.type)}
              </span>
              <span className={`status-badge ${post.status === 'resolved' ? 'resolved' : 'pending'}`}>
                {getStatusLabel(post.type, post.status)}
              </span>
            </div>
          </div>
          <button type="button" className="map-modal-close" onClick={onClose} aria-label="ปิดแผนที่">
            ✕
          </button>
        </div>
        <div className="map-modal-body">
          <MapContainer
            center={[post.latitude, post.longitude]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
            dragging
            touchZoom
            doubleClickZoom
            zoomControl
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[post.latitude, post.longitude]} />
          </MapContainer>
        </div>
        <div className="map-modal-footer">
          <span>📍 {Number(post.latitude).toFixed(5)}, {Number(post.longitude).toFixed(5)}</span>
          <span className="text-muted">ซูมเข้า-ออกและลากแผนที่ได้</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MapModal;
