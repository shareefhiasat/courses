import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { UserX, UserCheck, Search, Shield } from 'lucide-react';

const ManageEnrollmentsPage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(data);
    } catch (e) {
      console.error('[ManageEnrollments] Error loading classes:', e);
    }
  };

  const loadStudents = async (classId) => {
    setLoading(true);
    try {
      // Get class document to check disabledStudents
      const classDoc = await getDoc(doc(db, 'classes', classId));
      const classData = classDoc.exists() ? classDoc.data() : {};
      const disabledStudents = classData.disabledStudents || [];

      // Get all users
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter students enrolled in this class
      const enrolledStudents = allUsers.filter(u => {
        const enrolledClasses = u.enrolledClasses || [];
        return enrolledClasses.includes(classId);
      });

      // Add disabled status
      const studentsWithStatus = enrolledStudents.map(s => ({
        ...s,
        isDisabled: disabledStudents.includes(s.id)
      }));

      setStudents(studentsWithStatus);
    } catch (e) {
      console.error('[ManageEnrollments] Error loading students:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentAccess = async (studentId, currentlyDisabled) => {
    if (!selectedClass) return;
    try {
      const classRef = doc(db, 'classes', selectedClass.id);
      if (currentlyDisabled) {
        // Enable access - remove from disabledStudents array
        await updateDoc(classRef, {
          disabledStudents: arrayRemove(studentId)
        });
      } else {
        // Disable access - add to disabledStudents array
        await updateDoc(classRef, {
          disabledStudents: arrayUnion(studentId)
        });
      }
      // Reload students
      await loadStudents(selectedClass.id);
    } catch (e) {
      console.error('[ManageEnrollments] Error toggling access:', e);
      alert('Failed to update: ' + (e?.message || 'unknown error'));
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.displayName || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.id || '').toLowerCase().includes(term)
    );
  });

  if (!isAdmin && !isInstructor) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <Shield size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2>Access Denied</h2>
        <p>This page is only accessible to instructors and admins.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Shield size={28} />
        {t('manage_enrollments') || 'Manage Student Access'}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Class List */}
        <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('classes') || 'Classes'} ({classes.length})</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {classes.map((cls, idx) => {
              const isSelected = selectedClass?.id === cls.id;
              const uniqueKey = cls.id || `class-${idx}`;
              return (
                <div
                  key={uniqueKey}
                  onClick={() => { setSelectedClass(cls); loadStudents(cls.id); }}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: isSelected ? 'rgba(102,126,234,0.12)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cls.name || cls.code}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {cls.term && `${cls.term}`} {cls.year && `• ${cls.year}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Students List */}
        <div style={{ padding: '1.5rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
          {!selectedClass ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <div>{t('select_class') || 'Select a class to manage student access'}</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{selectedClass.name || selectedClass.code}</h2>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {t('total_students') || 'Total Students'}: {students.length}
                  {' • '}
                  {t('disabled') || 'Disabled'}: {students.filter(s => s.isDisabled).length}
                </div>
              </div>

              {/* Search */}
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder={t('search_students') || 'Search students...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Info Box */}
              <div style={{ marginBottom: 16, padding: '1rem', background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: 8, fontSize: 13 }}>
                <strong>ℹ️ Info:</strong> Disabling a student prevents them from:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Accessing class chat</li>
                  <li>Viewing class activities</li>
                  <li>Submitting assignments</li>
                  <li>Scanning attendance (if implemented)</li>
                </ul>
                You can re-enable access anytime.
              </div>

              {/* Students Table */}
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  {t('loading') || 'Loading...'}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  {searchTerm ? (t('no_students_found') || 'No students found') : (t('no_students_enrolled') || 'No students enrolled in this class')}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
                  {filteredStudents.map(student => (
                    <div
                      key={student.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: student.isDisabled ? '#fee2e2' : '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {student.displayName || student.email}
                          {student.isDisabled && (
                            <span style={{ fontSize: 11, padding: '2px 6px', background: '#ef4444', color: 'white', borderRadius: 4, fontWeight: 600 }}>
                              DISABLED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {student.email}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          ID: {student.id}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStudentAccess(student.id, student.isDisabled)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: 8,
                          background: student.isDisabled ? '#10b981' : '#ef4444',
                          color: 'white',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13
                        }}
                      >
                        {student.isDisabled ? (
                          <>
                            <UserCheck size={16} />
                            {t('enable') || 'Enable'}
                          </>
                        ) : (
                          <>
                            <UserX size={16} />
                            {t('disable') || 'Disable'}
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageEnrollmentsPage;
