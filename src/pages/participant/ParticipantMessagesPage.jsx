import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../socket';
import { apiUrl } from '../../config/api';

const ParticipantMessagesPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [adminName] = useState('CYBERNERDS X OWASP');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const resolvedUserIdRef = useRef(null);

  const loadInbox = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await fetch(
        apiUrl(`/api/messages/inbox/${encodeURIComponent(user._id)}`)
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Could not load your messages.');
        return;
      }

      // Participants can only view messages sent by admin
      const adminMessages = (data.messages || []).filter((m) => m.senderRole === 'admin');
      setMessages(adminMessages);
      resolvedUserIdRef.current = data.userId;
      setError('');

      await fetch(apiUrl(`/api/messages/read/${encodeURIComponent(user._id)}`), {
        method: 'PUT',
      });
    } catch (err) {
      console.error('Error fetching inbox:', err);
      setError('Could not load your messages.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?._id) return;
    socket.connect();
    socket.emit('join_room', user._id);
    if (user.googleId) socket.emit('join_room', user.googleId);
  }, [user]);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 5000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  useEffect(() => {
    const handleReceive = (msg) => {
      if (msg.senderRole !== 'admin') return;

      const myId = String(resolvedUserIdRef.current || user?._id || '');
      const rid = String(msg.receiverId);
      const googleId = user?.googleId ? String(user.googleId) : '';

      const isForMe =
        rid === myId ||
        rid === String(user?._id) ||
        (googleId && rid === googleId);

      if (!isForMe) return;

      setMessages((prev) => {
        if (msg._id && prev.some((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
    };

    socket.on('receive_message', handleReceive);
    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2>Messages</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          View messages sent to you by the recruitment board. Replies are disabled.
        </p>
      </header>

      {error && (
        <p style={{ color: 'var(--danger, #ef4444)', marginBottom: '16px' }}>{error}</p>
      )}

      <div className="messages-container">
        <div className="chats-list">
          <div className="chat-item active">
            <div className="chat-sender">CYBERNERDS X OWASP</div>
            <div className="chat-preview">Recruitment messages</div>
          </div>
        </div>

        <div className="chat-window">
          <div className="chat-header">Private inbox · {adminName}</div>

          <div className="chat-messages">
            {loading && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading your messages...
              </p>
            )}
            {!loading && messages.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                No messages yet. When an admin messages you, it will show up here.
              </p>
            )}
            {messages.map((msg, index) => (
              <div key={msg._id || index} className="message-bubble incoming">
                <div
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.85,
                    marginBottom: '4px',
                    fontWeight: 'bold',
                  }}
                >
                  Recruitment Board
                </div>
                <div>{msg.text}</div>
                {msg.createdAt && (
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '6px' }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ParticipantMessagesPage;
