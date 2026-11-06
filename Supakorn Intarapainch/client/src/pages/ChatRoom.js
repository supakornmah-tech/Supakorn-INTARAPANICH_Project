import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from '../utils/ui';

const socket = io('http://localhost:5000');

function ChatRoom() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      toast.info("กรุณาเข้าสู่ระบบ");
      navigate('/login');
      return;
    }

    setMessages([]);
    socket.emit('join_room', conversationId);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/messages/${conversationId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("โหลดข้อความล้มเหลว", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    const handleReceiveMessage = (data) => {
      if (String(data.conversation_id) === String(conversationId)) {
        setMessages((prev) => [...prev, data]);
      }
    };
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.emit('leave_room', conversationId);
    };
  }, [conversationId, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const currentSenderId = user.id || user.user_id;
    if (!currentSenderId) {
      toast.error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    const messageData = {
      conversation_id: conversationId,
      sender_id: currentSenderId,
      message_text: newMessage,
      roomId: conversationId
    };

    try {
      await axios.post('http://localhost:5000/api/chat/send', messageData);
      socket.emit('send_message', messageData);
      setMessages((prev) => [...prev, { ...messageData, created_at: new Date().toISOString() }]);
      setNewMessage("");
    } catch (err) {
      console.error("Error details:", err.response?.data);
      toast.error("ส่งไม่สำเร็จ: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return (
    <div className="container mt-5 text-center">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="chat-container">
        <div className="chat-header">
          <h5>💬 ห้องสนทนา</h5>
          <button className="btn btn-sm btn-light" onClick={() => navigate('/inbox')}>
            ← กลับ
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => {
            const isMe = String(msg.sender_id) === String(user?.id || user?.user_id);
            return (
              <div key={index} className={`chat-message ${isMe ? 'sent' : 'received'}`}>
                <div className={`chat-bubble ${isMe ? 'sent' : 'received'}`}>
                  {msg.message_text}
                  <div className="chat-time">
                    {new Date(msg.created_at || Date.now()).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <div className="chat-input-area">
          <form onSubmit={handleSendMessage}>
            <div className="d-flex gap-2">
              <div className="flex-grow-1">
                <input
                  type="text"
                  className="form-control"
                  placeholder="พิมพ์ข้อความ..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-send">ส่ง</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
