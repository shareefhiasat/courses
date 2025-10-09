import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getUsers, getClasses, getEnrollments } from '../firebase/firestore';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { useLang } from '../contexts/LangContext';

const StudentProgressPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [classFilter, setClassFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const { t } = useLang();

  useEffect(() => {
    if (user && isAdmin) {
      loadStudentProgress();
    }
  }, [user, isAdmin]);

  const loadStudentProgress = async () => {
    try {
      const [result, classesRes, enrollmentsRes] = await Promise.all([
        getUsers(),
        getClasses(),
        getEnrollments()
      ]);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
      if (result.success) {
        // Keep only students
        const onlyStudents = (result.data || []).filter(u => (u.role || 'student') === 'student');
        // Calculate progress stats for each student
        const usersWithStats = onlyStudents.map(userData => {
          const progress = userData.progress || {};
          const progressEntries = Object.entries(progress);
          const completedActivities = progressEntries.filter(([_, p]) => p.completed).length;
          const totalScore = progressEntries.reduce((sum, [_, p]) => sum + (p.score || 0), 0);
          const averageScore = progressEntries.length > 0 ? (totalScore / progressEntries.length).toFixed(1) : 0;
          const lastActivityFromActivities = progressEntries.length > 0 ? 
            Math.max(...progressEntries.map(([_, p]) => p.completedAt ? new Date(p.completedAt).getTime() : 0)) : 0;

          const resourceProgress = userData.resourceProgress || {};
          const resourceEntries = Object.entries(resourceProgress);
          const completedResources = resourceEntries.filter(([_, r]) => r && r.completed).length;
          const lastActivityFromResources = resourceEntries.length > 0 ?
            Math.max(...resourceEntries.map(([_, r]) => r && r.completedAt ? new Date(r.completedAt.seconds ? r.completedAt.seconds * 1000 : r.completedAt).getTime() : 0)) : 0;

          const lastActivityTs = Math.max(lastActivityFromActivities, lastActivityFromResources);

          return {
            ...userData,
            completedCount: completedActivities,
            resourceCompletedCount: completedResources,
            totalScore,
            averageScore,
            totalActivities: progressEntries.length,
            totalResources: resourceEntries.length,
            lastActivity: lastActivityTs > 0 ? new Date(lastActivityTs) : null,
            progressEntries,
            resourceEntries
          };
        }).sort((a, b) => b.totalScore - a.totalScore);
        
        setUsers(usersWithStats);
      }
    } catch (error) {
      console.error('Error loading student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loading message={t('loading')} />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <Loading message={t('loading_student_progress') || 'Loading student progress...'} />;
  }

  const filteredUsers = users.filter(u => {
    const searchMatch = u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!searchMatch) return false;
    
    // Filter by class
    if (classFilter !== 'all') {
      const userEnrollments = enrollments.filter(e => e.userId === u.docId);
      const hasClass = userEnrollments.some(e => e.classId === classFilter);
      if (!hasClass) return false;
    }
    
    // Filter by term
    if (termFilter !== 'all') {
      const userEnrollments = enrollments.filter(e => e.userId === u.docId);
      const enrolledClassIds = userEnrollments.map(e => e.classId);
      const enrolledClasses = classes.filter(c => enrolledClassIds.includes(c.docId));
      const hasTerm = enrolledClasses.some(c => c.term === termFilter);
      if (!hasTerm) return false;
    }
    
    return true;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ 
        background: '#ffffff',
        color: '#1f2937',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>📊 {t('student_progress_overview') || 'Student Progress Overview'}</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>{t('monitor_student_progress') || 'Monitor all student progress and performance'}</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder={t('search_students') || 'Search students...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              width: '300px',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '1rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">{t('all_classes') || 'All Classes'}</option>
            {classes.map(cls => (
              <option key={cls.docId} value={cls.docId}>{cls.name}</option>
            ))}
          </select>
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '1rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">{t('all_terms') || 'All Terms'}</option>
            {[...new Set(classes.map(c => c.term))].filter(Boolean).map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
              {filteredUsers.length}
            </div>
            <div>{t('total_students') || 'Total Students'}</div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
              {filteredUsers.reduce((sum, u) => sum + u.completedCount + (u.resourceCompletedCount || 0), 0)}
            </div>
            <div>{t('total_completions') || 'Total Completions'}</div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
              {filteredUsers.length > 0 ? 
                (filteredUsers.reduce((sum, u) => sum + parseFloat(u.averageScore), 0) / filteredUsers.length).toFixed(1) 
                : 0}
            </div>
            <div>{t('average_score') || 'Average Score'}</div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{t('student_details') || 'Student Details'}</h2>
        
        {filteredUsers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>{t('student') || 'Student'}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t('completed') || 'Completed'}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t('total_score') || 'Total Score'}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t('avg_score') || 'Avg Score'}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t('last_activity') || 'Last Activity'}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t('actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((student, index) => (
                  <tr key={student.id} style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    background: index % 2 === 0 ? '#f8f9fa' : 'white'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {student.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{student.email}</div>
                          {student.displayName && (
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>{student.displayName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          background: student.completedCount > 0 ? '#28a745' : '#6c757d',
                          color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem'
                        }}>
                          A: {student.completedCount}/{student.totalActivities}
                        </span>
                        <span style={{
                          background: (student.resourceCompletedCount || 0) > 0 ? '#4caf50' : '#6c757d',
                          color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem'
                        }}>
                          R: {student.resourceCompletedCount || 0}/{student.totalResources || 0}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#667eea' }}>
                      {student.totalScore}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {student.averageScore}%
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                      {student.lastActivity ? student.lastActivity.toLocaleDateString('en-GB') : (t('never') || 'Never')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setDetailOpen(true);
                        }}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        {t('view_details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>{t('no_students_found') || 'No students found'}</h3>
            <p>{t('no_students_match') || 'No students match your search criteria.'}</p>
          </div>
        )}
      </div>
      {/* Detailed progress modal */}
      <Modal
        open={detailOpen}
        title={selectedStudent ? `${t('detailed_progress') || 'Detailed Progress'} — ${selectedStudent.displayName || selectedStudent.email}` : (t('detailed_progress') || 'Detailed Progress')}
        onClose={() => { setDetailOpen(false); setSelectedStudent(null); }}
        actions={
          <button className="modal-btn-secondary" onClick={() => { setDetailOpen(false); setSelectedStudent(null); }}>
            {t('close')}
          </button>
        }
      >
        {selectedStudent ? (
          (selectedStudent.progressEntries && selectedStudent.progressEntries.length > 0) || (selectedStudent.resourceEntries && selectedStudent.resourceEntries.length > 0) ? (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0 }}>{t('activities') || 'Activities'}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('activity_id') || 'Activity ID'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('status') || 'Status'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('score') || 'Score'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('completed_at') || 'Completed At'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('notes') || 'Notes'}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.progressEntries.map(([activityId, progress]) => {
                    const completedAtDate = progress.completedAt ? new Date(progress.completedAt) : null;
                    return (
                      <tr key={activityId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <code>{activityId}</code>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {progress.completed ? (t('completed_check') || '✅ Completed') : (t('pending_clock') || '⏳ Pending')}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#667eea' }}>
                          {progress.score != null ? `${progress.score} / 100` : '—'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {completedAtDate ? completedAtDate.toLocaleString('en-GB') : '—'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {progress.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <h3>{t('resources') || 'Resources'}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('resource_id') || 'Resource ID'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('status') || 'Status'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('completed_at') || 'Completed At'}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.resourceEntries && selectedStudent.resourceEntries.map(([rid, rp]) => (
                    <tr key={rid} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '0.75rem' }}><code>{rid}</code></td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{rp?.completed ? '✅ Completed' : '⏳ Pending'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {rp?.completedAt ? new Date(rp.completedAt.seconds ? rp.completedAt.seconds * 1000 : rp.completedAt).toLocaleString('en-GB') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: 8 }}>
                  <strong>{t('activities_completed') || 'Activities Completed'}:</strong> {selectedStudent.completedCount}
                </div>
                <div style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: 8 }}>
                  <strong>{t('resources_completed') || 'Resources Completed'}:</strong> {selectedStudent.resourceCompletedCount || 0}
                </div>
                <div style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: 8 }}>
                  <strong>{t('total_activities') || 'Total Activities'}:</strong> {selectedStudent.totalActivities}
                </div>
                <div style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: 8 }}>
                  <strong>{t('total_resources') || 'Total Resources'}:</strong> {selectedStudent.totalResources || 0}
                </div>
                <div style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: 8 }}>
                  <strong>{t('total_score') || 'Total Score'}:</strong> {selectedStudent.totalScore}
                </div>
                <div style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: 8 }}>
                  <strong>{t('average_score') || 'Average Score'}:</strong> {selectedStudent.averageScore}%
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              No progress records for this student yet.
            </div>
          )
        ) : null}
      </Modal>
    </div>
  );
};

export default StudentProgressPage;
