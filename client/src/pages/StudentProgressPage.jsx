import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getUsers, getClasses, getEnrollments, getActivities, getSubmissions, gradeSubmission } from '../firebase/firestore';
import Loading from '../components/Loading';
import { useLang } from '../contexts/LangContext';
import { useToast } from '../components/ToastProvider';

const StudentProgressPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [classFilter, setClassFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const { t } = useLang();
  const toast = useToast();

  useEffect(() => {
    if (user && isAdmin) {
      loadStudentProgress();
    }
  }, [user, isAdmin]);

  const loadStudentProgress = async () => {
    try {
      const [result, classesRes, enrollmentsRes, activitiesRes, submissionsRes] = await Promise.all([
        getUsers(),
        getClasses(),
        getEnrollments(),
        getActivities(),
        getSubmissions()
      ]);
      
      if (classesRes.success) setClasses(classesRes.data || []);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
      if (activitiesRes.success) setActivities(activitiesRes.data || []);
      if (submissionsRes.success) setSubmissions(submissionsRes.data || []);
      
      if (result.success) {
        const allActivities = activitiesRes.data || [];
        const allSubmissions = submissionsRes.data || [];
        
        // Keep only students
        const onlyStudents = (result.data || []).filter(u => (u.role || 'student') === 'student');
        
        // Calculate progress stats for each student based on submissions
        const usersWithStats = onlyStudents.map(userData => {
          // Get submissions for this student
          const userSubmissions = allSubmissions.filter(s => 
            s.userId === userData.docId || s.userId === userData.id
          );
          
          // Calculate stats by type
          const statsByType = {};
          allActivities.forEach(activity => {
            const type = activity.type || 'other';
            if (!statsByType[type]) {
              statsByType[type] = { total: 0, completed: 0 };
            }
            statsByType[type].total++;
            
            const submission = userSubmissions.find(s => s.activityId === activity.docId);
            if (submission && submission.status === 'graded') {
              statsByType[type].completed++;
            }
          });
          
          // Calculate overall stats
          const completedCount = userSubmissions.filter(s => s.status === 'graded').length;
          const totalScore = userSubmissions
            .filter(s => s.status === 'graded' && s.score != null)
            .reduce((sum, s) => sum + (s.score || 0), 0);
          const gradedCount = userSubmissions.filter(s => s.status === 'graded').length;
          const averageScore = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : 0;
          
          // Last activity
          const lastActivityTs = userSubmissions.length > 0 ?
            Math.max(...userSubmissions.map(s => {
              const date = s.submittedAt?.seconds ? new Date(s.submittedAt.seconds * 1000) : 
                           s.submittedAt ? new Date(s.submittedAt) : new Date(0);
              return date.getTime();
            })) : 0;

          return {
            ...userData,
            completedCount,
            totalScore,
            averageScore,
            totalActivities: allActivities.length,
            lastActivity: lastActivityTs > 0 ? new Date(lastActivityTs) : null,
            userSubmissions,
            statsByType
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          >
            <option value="all">{t('all_types') || 'All Types'}</option>
            <option value="quiz">Quiz</option>
            <option value="training">Training</option>
            <option value="assignment">Assignment</option>
            <option value="optional">Optional</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            background: 'white',
            padding: '0.9rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#800020' }}>
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
              {filteredUsers.reduce((sum, u) => sum + u.completedCount, 0)}
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

        {/* Activity Type Breakdown */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '0.75rem',
          marginTop: '0.75rem'
        }}>
          {(() => {
            const typeStats = {};
            filteredUsers.forEach(user => {
              Object.entries(user.statsByType || {}).forEach(([type, stats]) => {
                if (!typeStats[type]) {
                  typeStats[type] = { total: 0, completed: 0 };
                }
                typeStats[type].total += stats.total;
                typeStats[type].completed += stats.completed;
              });
            });

            const typeColors = {
              quiz: '#17a2b8',
              training: '#28a745',
              assignment: '#ffc107',
              optional: '#6c757d'
            };

            return Object.entries(typeStats).map(([type, stats]) => (
              <div key={type} style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${typeColors[type] || '#667eea'}`
              }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                  {type}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: typeColors[type] || '#667eea' }}>
                  {stats.completed}/{stats.total}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% Complete
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        background: 'white',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '0.4rem',
        padding: '0.4rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => { setActiveTab('overview'); setSelectedStudent(null); }}
          style={{
            padding: '0.6rem 1.2rem',
            background: activeTab === 'overview' ? 'linear-gradient(135deg, #800020, #600018)' : 'transparent',
            color: activeTab === 'overview' ? 'white' : '#666',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap'
          }}
        >
          📊 Overview
        </button>
        {selectedStudent && (
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '0.6rem 1.2rem',
              background: activeTab === 'details' ? 'linear-gradient(135deg, #800020, #600018)' : 'transparent',
              color: activeTab === 'details' ? 'white' : '#666',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}
          >
            👤 {selectedStudent.displayName || selectedStudent.email}
          </button>
        )}
        {gradingSubmission && (
          <button
            onClick={() => setActiveTab('grade')}
            style={{
              padding: '0.6rem 1.2rem',
              background: activeTab === 'grade' ? 'linear-gradient(135deg, #800020, #600018)' : 'transparent',
              color: activeTab === 'grade' ? 'white' : '#666',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}
          >
            📝 Grade
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 12px 12px',
        padding: '0.75rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minHeight: '350px'
      }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>{t('student_list') || 'Student List'}</h3>
            {filteredUsers.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {filteredUsers.map((student) => (
                  <div
                    key={student.docId || student.id}
                    onClick={() => { setSelectedStudent(student); setActiveTab('details'); }}
                    style={{
                      padding: '0.75rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e9ecef';
                      e.currentTarget.style.borderColor = '#800020';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        {student.email?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{student.displayName || student.email}</div>
                        {student.displayName && <div style={{ fontSize: '0.75rem', color: '#666' }}>{student.email}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Completed</div>
                        <div style={{ fontWeight: '600', color: '#28a745', fontSize: '0.9rem' }}>
                          {student.completedCount}/{student.totalActivities}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Avg</div>
                        <div style={{ fontWeight: '600', color: '#800020', fontSize: '0.9rem' }}>
                          {student.averageScore}%
                        </div>
                      </div>
                      <div style={{
                        padding: '0.4rem 0.8rem',
                        background: '#800020',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        View →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p>{t('no_students_found') || 'No students found'}</p>
              </div>
            )}
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && selectedStudent && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('activities') || 'Activities'}</h3>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all">{t('all_types') || 'All Types'}</option>
                <option value="quiz">Quiz</option>
                <option value="training">Training</option>
                <option value="assignment">Assignment</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('activity') || 'Activity'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('status') || 'Status'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('grade') || 'Grade'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('submitted') || 'Submitted'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.filter(a => typeFilter === 'all' || a.type === typeFilter).map(activity => {
                    const submission = selectedStudent.userSubmissions.find(s => s.activityId === activity.docId);
                    const status = !submission ? 'not_started' : (submission.status === 'graded' ? 'graded' : 'pending');
                    
                    return (
                      <tr key={activity.docId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{activity.titleEn || activity.title}</span>
                            {activity.allowRetake && (
                              <span style={{
                                fontSize: '0.65rem',
                                background: '#17a2b8',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '600'
                              }}>
                                🔄
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{activity.type}</div>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          {status === 'not_started' && (
                            <span style={{ color: '#999', fontSize: '0.8rem' }}>⭕</span>
                          )}
                          {status === 'pending' && (
                            <span style={{ color: '#ffc107', fontSize: '0.8rem', fontWeight: '600' }}>⏳</span>
                          )}
                          {status === 'graded' && (
                            <span style={{ color: '#28a745', fontSize: '0.8rem', fontWeight: '600' }}>✅</span>
                          )}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: '#800020', fontSize: '0.85rem' }}>
                          {submission && submission.status === 'graded' ? (
                            <span>{submission.score || 0}/{activity.maxScore || 100}</span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                          {submission ? (
                            new Date(submission.submittedAt?.seconds ? submission.submittedAt.seconds * 1000 : submission.submittedAt).toLocaleDateString('en-GB')
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          {submission && submission.status !== 'graded' && (
                            <button
                              onClick={() => {
                                setGradingSubmission(submission);
                                setGradeForm({ score: '', feedback: submission.feedback || '' });
                                setActiveTab('grade');
                              }}
                              style={{
                                padding: '0.3rem 0.6rem',
                                background: 'linear-gradient(135deg, #800020, #600018)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}
                            >
                              📝
                            </button>
                          )}
                          {submission && submission.status === 'graded' && (
                            <button
                              onClick={() => {
                                setGradingSubmission(submission);
                                setGradeForm({ score: submission.score || '', feedback: submission.feedback || '' });
                                setActiveTab('grade');
                              }}
                              style={{
                                padding: '0.3rem 0.6rem',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              ✏️
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grade Tab */}
        {activeTab === 'grade' && gradingSubmission && (
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>{t('grade_submission') || 'Grade Submission'}</h3>
            
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>{t('activity') || 'Activity'}:</strong>{' '}
                {activities.find(a => a.docId === gradingSubmission.activityId)?.titleEn || activities.find(a => a.docId === gradingSubmission.activityId)?.title || gradingSubmission.activityTitle || 'Unknown Activity'}
              </div>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                <strong>ID:</strong> {gradingSubmission.activityId}
              </div>
              
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>{t('submitted_at') || 'Submitted'}:</strong>{' '}
                {new Date(gradingSubmission.submittedAt?.seconds ? gradingSubmission.submittedAt.seconds * 1000 : gradingSubmission.submittedAt).toLocaleString('en-GB')}
              </div>

              {gradingSubmission.files && gradingSubmission.files.length > 0 && (
                <div>
                  <strong>{t('files') || 'Files'}:</strong>
                  <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                    {gradingSubmission.files.map((file, idx) => (
                      <li key={idx}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#800020' }}>
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                {t('score') || 'Score'} *
              </label>
              <input
                type="number"
                min="0"
                max={activities.find(a => a.docId === gradingSubmission.activityId)?.maxScore || 100}
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                placeholder={`0 - ${activities.find(a => a.docId === gradingSubmission.activityId)?.maxScore || 100}`}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                {t('feedback') || 'Feedback'} ({t('optional') || 'Optional'})
              </label>
              <textarea
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                placeholder={t('enter_feedback') || 'Enter feedback for the student...'}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setGradingSubmission(null);
                  setGradeForm({ score: '', feedback: '' });
                  setActiveTab('details');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={async () => {
                  if (!gradeForm.score) {
                    toast?.showError('Please enter a score');
                    return;
                  }
                  
                  try {
                    const activity = activities.find(a => a.docId === gradingSubmission.activityId);
                    const maxScore = activity?.maxScore || 100;
                    const score = parseInt(gradeForm.score);
                    
                    if (isNaN(score) || score < 0 || score > maxScore) {
                      toast?.showError(`Score must be between 0 and ${maxScore}`);
                      return;
                    }
                    
                    const result = await gradeSubmission(gradingSubmission.docId || gradingSubmission.id, {
                      score,
                      feedback: gradeForm.feedback,
                      status: 'graded',
                      gradedAt: new Date(),
                      gradedBy: user?.uid || 'admin'
                    });
                    
                    if (result.success) {
                      // Send email notification if activity has email enabled
                      const activity = activities.find(a => a.docId === gradingSubmission.activityId);
                      if (activity?.sendGradeEmail) {
                        try {
                          const { sendEmail } = await import('../firebase/firestore');
                          await sendEmail({
                            to: selectedStudent.email,
                            template: 'activityGraded',
                            data: {
                              studentName: selectedStudent.displayName || selectedStudent.email,
                              activityTitle: activity.titleEn || activity.title,
                              score,
                              maxScore: activity.maxScore || 100,
                              feedback: gradeForm.feedback,
                              dateTime: new Date().toLocaleString('en-GB')
                            }
                          });
                        } catch (emailError) {
                          console.error('Failed to send grade email:', emailError);
                        }
                      }
                      
                      toast?.showSuccess('✅ Submission graded successfully!');
                      setGradingSubmission(null);
                      setGradeForm({ score: '', feedback: '' });
                      setActiveTab('details');
                      await loadStudentProgress();
                    } else {
                      toast?.showError('Failed to grade submission: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error grading:', error);
                    toast?.showError('Error grading submission: ' + error.message);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #800020, #600018)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {t('save_grade') || 'Save Grade'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgressPage;
