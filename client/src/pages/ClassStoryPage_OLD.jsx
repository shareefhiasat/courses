import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, addDoc, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useToast } from '../components/ToastProvider';
import Loading from '../components/Loading';
import '../styles/military-theme.css';

const ClassStoryPage = () => {
  const { classId } = useParams();
  const { user, isAdmin } = useAuth();
  const { lang, t } = useLang();
  const { showSuccess, showError, showInfo } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noAccess, setNoAccess] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [className, setClassName] = useState('');

  useEffect(() => {
    loadClassInfo();
    loadPosts();
  }, [classId]);

  const resolveClassId = async () => {
    if (classId) return classId;
    // fallback to first enrolled class for current user
    try {
      const u = await getDoc(doc(db, 'users', user.uid));
      const data = u.exists() ? u.data() : {};
      const first = Array.isArray(data.enrolledClasses) && data.enrolledClasses.length > 0 ? data.enrolledClasses[0] : null;
      return first;
    } catch { return null; }
  };

  const loadClassInfo = async () => {
    try {
      const effId = await resolveClassId();
      if (!effId) return;
      const classDoc = await getDoc(doc(db, 'classes', effId));
      if (classDoc.exists()) {
        setClassName(classDoc.data().name || 'Class');
      }
    } catch (error) {
      console.error('Error loading class info:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const effId = await resolveClassId();
      if (!effId) {
        setPosts([]);
        setLoading(false);
        return;
      }
      const q = query(
        collection(db, 'classPosts'),
        where('classId', '==', effId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    } catch (error) {
      const code = error?.code || '';
      if (code === 'permission-denied') {
        setNoAccess(true);
      } else {
        console.error('Error loading posts:', error);
        showError(t('error_loading_data') || 'Error loading posts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      showInfo(t('please_enter_content') || 'Please enter some content');
      return;
    }

    setPosting(true);
    try {
      const effId = await resolveClassId();
      if (!effId) {
        showError(t('select_class') || 'Please select a class');
        setPosting(false);
        return;
      }
      await addDoc(collection(db, 'classPosts'), {
        classId: effId,
        content: newPostContent.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        timestamp: Timestamp.now(),
        likes: 0,
        comments: []
      });

      setNewPostContent('');
      showSuccess(t('post_created') || 'Post created successfully!');
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      showError(t('error_occurred') || 'Error creating post');
    } finally {
      setPosting(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('just_now') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('minutes_ago') || 'minutes ago'}`;
    if (diffHours < 24) return `${diffHours} ${t('hours_ago') || 'hours ago'}`;
    if (diffDays === 1) return t('yesterday') || 'Yesterday';
    return `${diffDays} ${t('days_ago') || 'days ago'}`;
  };

  if (loading) return <Loading />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-primary)',
          fontSize: '2.5rem',
          color: 'var(--navy-dark)',
          marginBottom: '0.5rem'
        }}>
          📸 {t('class_story') || 'Class Story'}
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--military-gray)'
        }}>
          {className}
        </p>
      </div>

      {/* New Post (Instructors only) */}
      {isAdmin && (
        <div className="card-military" style={{ marginBottom: '2rem' }}>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={t('write_post') || 'Write a post...'}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '1rem',
              borderRadius: '8px',
              border: '2px solid var(--military-light-gray)',
              fontFamily: 'var(--font-secondary)',
              fontSize: '1rem',
              resize: 'vertical',
              marginBottom: '1rem'
            }}
          />
          <button
            onClick={handleCreatePost}
            disabled={posting || !newPostContent.trim()}
            className="btn-military-gold"
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              opacity: (posting || !newPostContent.trim()) ? 0.5 : 1,
              cursor: (posting || !newPostContent.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {posting ? (t('posting') || 'Posting...') : (t('post_to_class') || 'Post to Class')}
          </button>
        </div>
      )}

      {/* Posts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {noAccess && (
          <div className="card-military" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            {t('no_access_class_posts') || 'You do not have permission to view class posts.'}
          </div>
        )}
        {!noAccess && (posts.length === 0 ? (
          <div className="card-military" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ fontSize: '1.125rem', color: '#888' }}>
              {t('no_posts_yet') || 'No posts yet. Be the first to share!'}
            </p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.docId} className="card-military">
              {/* Post Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid var(--military-light-gray)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--gradient-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    border: '2px solid var(--military-gold)'
                  }}>
                    {post.authorName?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: 'var(--navy-dark)'
                    }}>
                      {post.authorName || 'Unknown'}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#888'
                    }}>
                      {getTimeAgo(post.timestamp)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div style={{
                fontSize: '1rem',
                lineHeight: '1.6',
                color: 'var(--military-gray)',
                whiteSpace: 'pre-wrap',
                marginBottom: '1rem'
              }}>
                {post.content}
              </div>

              {/* Post Actions */}
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--military-light-gray)'
              }}>
                <button style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  color: 'var(--military-gray)',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--military-gold)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--military-gray)'}
                >
                  <span style={{ fontSize: '1.25rem' }}>👍</span>
                  <span>{post.likes || 0}</span>
                </button>
                
                <button style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  color: 'var(--military-gray)',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--navy-blue)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--military-gray)'}
                >
                  <span style={{ fontSize: '1.25rem' }}>💬</span>
                  <span>{post.comments?.length || 0}</span>
                </button>
              </div>
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

export default ClassStoryPage;
