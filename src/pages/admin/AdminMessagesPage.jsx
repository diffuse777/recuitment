import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../socket';
import { apiUrl } from '../../config/api';

const AdminMessagesPage = () => {
  const { user: adminUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!adminUser?._id) return;
    socket.connect();
    socket.emit('join_room', adminUser._id);
    return () => {
      socket.disconnect();
    };
  }, [adminUser]);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await fetch(apiUrl('/api/applications'));
        const data = await response.json();
        setConversations(data.applications || []);
        if (data.applications?.length > 0) {
          setActiveChatId(String(data.applications[0].userId));
        }
      } catch (error) {
        console.error('Error fetching applicants for chat:', error);
      }
    };
    fetchApplicants();
  }, []);

  useEffect(() => {
    if (!activeChatId || !adminUser?._id) return;
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/messages/${adminUser._id}/${activeChatId}`)
        );
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };
    fetchHistory();
  }, [activeChatId, adminUser]);

  useEffect(() => {
    const handleReceive = (msg) => {
      const sid = String(msg.senderId);
      const rid = String(msg.receiverId);
      const active = String(activeChatId);
      if (sid === active || rid === active) {
        setMessages((prev) => {
          if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };
    socket.on('receive_message', handleReceive);
    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChat = conversations.find(
    (c) => String(c.userId) === String(activeChatId)
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !adminUser?._id) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch(apiUrl('/api/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: adminUser._id,
          receiverId: activeChatId,
          text,
          senderRole: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Send failed:', data.message);
        setNewMessage(text);
        return;
      }
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(data.message._id))) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error('Send failed:', err);
      setNewMessage(text);
    }
  };

  if (!adminUser?._id || adminUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2>Recruitment Messaging Desk</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Respond to applicant questions and coordinate interviews.
        </p>
      </header>

      <div className="messages-container">
        <div className="chats-list">
          {conversations.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No applications submitted yet.
            </div>
          ) : (
            conversations.map((chat) => {
              const uid = String(chat.userId);
              return (
                <div
                  key={uid}
                  className={`chat-item ${uid === String(activeChatId) ? 'active' : ''}`}
                  onClick={() => setActiveChatId(uid)}
                >
                  <div
                    className="chat-sender"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{chat.name}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        fontWeight: 'normal',
                      }}
                    >
                      {chat.department}
                    </span>
                  </div>
                  <div
                    className="chat-preview"
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}
                  >
                    {chat.email}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="chat-window">
          {activeChat ? (
            <>
              <div
                className="chat-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Conversation with {activeChat.name}</span>
                <span className="badge badge-primary">{activeChat.department}</span>
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No messages yet. Write below to contact this applicant.
                  </p>
                )}
                {messages.map((msg, index) => (
                  <div
                    key={msg._id || index}
                    className={`message-bubble ${
                      msg.senderRole === 'admin' ? 'outgoing' : 'incoming'
                    }`}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        marginBottom: '4px',
                        fontWeight: 'bold',
                      }}
                    >
                      {msg.senderRole === 'admin' ? 'You' : activeChat.name}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="chat-input-area" style={{ alignItems: 'flex-end' }}>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder={`Message ${activeChat.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  style={{ resize: 'none', minHeight: '48px' }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--sidebar-bg)', whiteSpace: 'nowrap' }}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesPage;
