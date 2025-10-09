import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getClasses, getEnrollments } from '../firebase/firestore';
import Loading from '../components/Loading';

const ChatPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState('global');
  const [classes, setClasses] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadUserClasses();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeRoom) {
      subscribeToMessages();
    }
  }, [user, activeRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUserClasses = async () => {
    try {
      const [classesRes, enrollmentsRes] = await Promise.all([
        getClasses(),
        getEnrollments()
      ]);
      
      if (classesRes.success) setClasses(classesRes.data);
      
      if (enrollmentsRes.success) {
        const userEnrollments = enrollmentsRes.data.filter(e => e.userId === user.uid);
        const userClassIds = userEnrollments.map(e => e.classId);
        const userClassData = classesRes.data?.filter(c => userClassIds.includes(c.id)) || [];
        setUserClasses(userClassData);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const subscribeToMessages = () => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('room', '==', activeRoom),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const newMessages = [];
      snapshot.forEach(doc => {
        newMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(newMessages);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage.trim(),
        room: activeRoom,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoomName = (roomId) => {
    if (roomId === 'global') return 'Global Chat';
    const roomClass = classes.find(c => c.id === roomId);
    return roomClass ? `${roomClass.name} (${roomClass.code})` : roomId;
  };

  if (authLoading) {
    return <Loading message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 120px)' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <h1>💬 Chat & Discussion</h1>
        <p>Connect with your classmates and instructors</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100% - 120px)' }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          background: 'white',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Chat Rooms</h3>
          
          <div
            onClick={() => setActiveRoom('global')}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              background: activeRoom === 'global' ? '#667eea' : '#f8f9fa',
              color: activeRoom === 'global' ? 'white' : '#333',
              transition: 'all 0.2s'
            }}
          >
            🌍 Global Chat
          </div>

          {userClasses.length > 0 && (
            <>
              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>My Classes</h4>
              {userClasses.map(cls => (
                <div
                  key={cls.id}
                  onClick={() => setActiveRoom(cls.id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    background: activeRoom === cls.id ? '#667eea' : '#f8f9fa',
                    color: activeRoom === cls.id ? 'white' : '#333',
                    transition: 'all 0.2s'
                  }}
                >
                  📚 {cls.name}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            borderRadius: '12px 12px 0 0'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{getRoomName(activeRoom)}</h3>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            maxHeight: '400px'
          }}>
            {messages.length > 0 ? (
              messages.map(message => (
                <div key={message.id} style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: message.userId === user.uid ? 'row-reverse' : 'row'
                }}>
                  <div style={{
                    maxWidth: '70%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: message.userId === user.uid ? '#667eea' : '#f8f9fa',
                    color: message.userId === user.uid ? 'white' : '#333'
                  }}>
                    {message.userId !== user.uid && (
                      <div style={{ fontSize: '0.8rem', marginBottom: '0.25rem', opacity: 0.8 }}>
                        {message.userEmail}
                      </div>
                    )}
                    <div>{message.text}</div>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      marginTop: '0.25rem', 
                      opacity: 0.7,
                      textAlign: message.userId === user.uid ? 'right' : 'left'
                    }}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                No messages yet. Start the conversation!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} style={{
            padding: '1rem',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
