import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ChatList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id || user?.user_id;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/list/${userId}`);
        setChats(res.data);
      } catch (err) {
        console.error("โหลดรายการแชทล้มเหลว", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchChats();
    else setLoading(false);
  }, [userId]);

  if (loading) return (
    <div className="container mt-5 text-center">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="container mt-4 fade-in">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h3 className="fw-bold mb-1">📥 กล่องข้อความ</h3>
          <p className="text-muted mb-4">รายการสนทนาทั้งหมดของคุณ</p>

          {chats.length > 0 ? (
            <div>
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="chat-list-item d-flex justify-content-between align-items-center"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <div>
                    <div className="fw-bold" style={{ color: 'var(--primary)' }}>{chat.title}</div>
                    <div className="small text-muted d-flex align-items-center gap-2 mt-1">
                      <span>💬 คุยกับ:</span>
                      <span className="fw-medium" style={{ color: 'var(--text-secondary)' }}>
                        {chat.user_one === userId ? chat.visitor_name : chat.owner_name}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-pill">เปิดแชท →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h5 className="fw-bold">ยังไม่มีข้อความ</h5>
              <p>เมื่อคุณทักแชทสอบถามประกาศ จะปรากฏที่นี่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatList;
