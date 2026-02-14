import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@services/other/config';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Award, 
  MessageSquare, 
  AlertTriangle,
  Calendar,
  Target,
  X,
  Plus,
  Minus,
  Heart,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button, Input, Card, CardBody, Loading, Select } from '@ui';
import { markAttendance } from '@services/business/attendanceService';
import { getPerformedByFields } from '@services/business/userService';
import { getClasses } from '@services/business/classService';
import { getEnrollments } from '@services/business/enrollmentService';
import { addNotification } from '@services/business/notificationService';
import { DEFAULT_ACCENT, normalizeHexColor } from '@utils/color';
import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import './StudentQuickActionModal.css';

const StudentQuickActionModal = ({ 
  student, 
  isOpen, 
  onClose, 
  onSuccess = null,
  initialContext = {},
  classes = []
}) => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t, isRTL } = useLang();
  const { isDark, theme } = useTheme();
  
  // State management
  const [activeTab, setActiveTab] = useState(RECORD_TYPES.ATTENDANCE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [selectedClass, setSelectedClass] = useState(initialContext.classId || '');
  const [selectedProgram, setSelectedProgram] = useState(initialContext.programId || '');
  const [selectedSubject, setSelectedSubject] = useState(initialContext.subjectId || '');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attendanceNote, setAttendanceNote] = useState('');
  const [participationDelta, setParticipationDelta] = useState(1);
  const [participationNote, setParticipationNote] = useState('');
  const [penaltyType, setPenaltyType] = useState('');
  const [penaltyNote, setPenaltyNote] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(1);
  const [behaviorType, setBehaviorType] = useState('');
  const [behaviorNote, setBehaviorNote] = useState('');
  const [behaviorSeverity, setBehaviorSeverity] = useState('medium');
  
  // Data state
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({
    context: false,
    attendance: false,
    participation: false,
    penalty: false,
    behavior: false
  });
  
  // Theme color
  const accentColor = useMemo(() => {
    try {
      const savedColor = localStorage.getItem('userMessageColor');
      return normalizeHexColor(savedColor, DEFAULT_ACCENT);
    } catch {
      return DEFAULT_ACCENT;
    }
  }, []);

  // Attendance status options
  const attendanceOptions = [
    { value: 'present', icon: <CheckCircle size={16} />, color: '#22c55e', label: 'Present' },
    { value: 'late', icon: <Clock size={16} />, color: '#eab308', label: 'Late' },
    { value: 'absent_no_excuse', icon: <XCircle size={16} />, color: '#ef4444', label: 'Absent (No Excuse)' },
    { value: 'absent_with_excuse', icon: <AlertCircle size={16} />, color: '#f97316', label: 'Absent (With Excuse)' },
    { value: 'excused_leave', icon: <Users size={16} />, color: '#800020', label: 'Excused Leave' },
    { value: 'human_case', icon: <Heart size={16} />, color: '#8b5cf6', label: 'Human Case' }
  ];

  // Penalty types
  const penaltyTypes = [
    { value: 'cheating', label: 'Cheating', points: 5 },
    { value: 'attempted_cheating', label: 'Attempted Cheating', points: 3 },
    { value: 'impersonation', label: 'Impersonation', points: 10 },
    { value: 'exam_disruption', label: 'Exam System Disruption', points: 7 },
    { value: 'forgery', label: 'Forgery in School Documents', points: 8 },
    { value: 'repetitive_absence_with_excuse', label: 'Repetitive Absence (With Excuse)', points: 2 },
    { value: 'repetitive_absence_without_excuse', label: 'Repetitive Absence (Without Excuse)', points: 4 },
    { value: 'other_violations', label: 'Other Violations', points: 1 }
  ];

  // Behavior types
  const behaviorTypes = BEHAVIOR_TYPES.map(type => ({
    value: type.id,
    label: type.label_en,
    severity: type.points <= -1 ? 'low' : type.points <= -2 ? 'medium' : 'high'
  }));

  // Load instructor's classes and programs
  useEffect(() => {
    if (!user?.uid || !isOpen) return;
    
    // Extract unique programs and subjects from passed classes
    const uniquePrograms = [...new Set(classes.map(cls => cls.programId).filter(Boolean))];
    const uniqueSubjects = [...new Set(classes.map(cls => cls.subjectId).filter(Boolean))];
    
    setPrograms(uniquePrograms);
    setSubjects(uniqueSubjects);
  }, [user, classes, isOpen]);

  // Filter classes based on selected program and subject
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      if (selectedProgram && cls.programId !== selectedProgram) return false;
      if (selectedSubject && cls.subjectId !== selectedSubject) return false;
      return true;
    });
  }, [classes, selectedProgram, selectedSubject]);

  // Handle attendance marking
  const handleMarkAttendance = async () => {
    if (!student?.uid || !selectedClass) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get performedBy fields using shared service
      const performedByFields = await getPerformedByFields(user);
      
      const today = new Date().toISOString().split('T')[0];
      
      const result = await markAttendance({
        classId: selectedClass,
        studentId: student.uid,
        date: today,
        status: attendanceStatus,
        markedBy: user.uid,
        method: 'qr_manual',
        notes: attendanceNote,
        ...performedByFields,
        studentInfo: {
          email: student.email,
          displayName: student.displayName
        },
        className: classes.find(c => c.id === selectedClass)?.name || selectedClass,
        sendNotification: true
      });
      
      if (result.success) {
        setSuccess(`Attendance marked: ${attendanceStatus} for ${student.displayName}`);
        
        if (onSuccess) {
          onSuccess({
            type: RECORD_TYPES.ATTENDANCE,
            data: {
              status: attendanceStatus,
              classId: selectedClass,
              note: attendanceNote
            }
          });
        }
        
        // Reset form
        setAttendanceNote('');
      } else {
        throw new Error(result.error || 'Failed to mark attendance');
      }
      
    } catch (error) {
      logger.error('Attendance marking failed:', error);
      setError(error.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  // Handle participation award
  const handleAwardParticipation = async () => {
    if (!student?.uid || !selectedClass) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Create participation record
      const participationRef = doc(collection(db, 'participations'));
      const participationData = {
        studentId: student.uid,
        classId: selectedClass,
        instructorId: user.uid,
        delta: participationDelta,
        note: participationNote,
        createdAt: serverTimestamp(),
        method: 'qr_manual'
      };
      
      await setDoc(participationRef, participationData);
      
      // Send notification
      await addNotification({
        userId: student.uid,
        title: 'Participation Awarded',
        message: `You were awarded ${participationDelta > 0 ? '+' : ''}${participationDelta} participation points${participationNote ? ': ' + participationNote : ''}`,
        type: RECORD_TYPES.PARTICIPATION,
        classId: selectedClass,
        data: participationData
      });
      
      setSuccess(`Participation awarded: ${participationDelta > 0 ? '+' : ''}${participationDelta} points to ${student.displayName}`);
      
      if (onSuccess) {
        onSuccess({
          type: RECORD_TYPES.PARTICIPATION,
          data: {
            delta: participationDelta,
            classId: selectedClass,
            note: participationNote
          }
        });
      }
      
      // Reset form
      setParticipationNote('');
      setParticipationDelta(1);
      
    } catch (error) {
      logger.error('Participation awarding failed:', error);
      setError(error.message || 'Failed to award participation');
    } finally {
      setLoading(false);
    }
  };

  // Handle penalty issuance
  const handleIssuePenalty = async () => {
    if (!student?.uid || !selectedClass || !penaltyType) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const penaltyInfo = penaltyTypes.find(p => p.value === penaltyType);
      const points = penaltyPoints || penaltyInfo?.points || 1;
      
      // Create penalty record
      const penaltyRef = doc(collection(db, 'penalties'));
      const penaltyData = {
        studentId: student.uid,
        classId: selectedClass,
        instructorId: user.uid,
        type: penaltyType,
        points: points,
        note: penaltyNote,
        createdAt: serverTimestamp(),
        method: 'qr_manual'
      };
      
      await setDoc(penaltyRef, penaltyData);
      
      // Send notification
      await addNotification({
        userId: student.uid,
        title: 'Penalty Issued',
        message: `A penalty has been issued: ${penaltyInfo?.label || penaltyType}${penaltyNote ? ' - ' + penaltyNote : ''}`,
        type: RECORD_TYPES.PENALTY,
        classId: selectedClass,
        data: penaltyData
      });
      
      setSuccess(`Penalty issued: ${penaltyInfo?.label || penaltyType} (${points} points) to ${student.displayName}`);
      
      if (onSuccess) {
        onSuccess({
          type: RECORD_TYPES.PENALTY,
          data: {
            type: penaltyType,
            points: points,
            classId: selectedClass,
            note: penaltyNote
          }
        });
      }
      
      // Reset form
      setPenaltyNote('');
      setPenaltyType('');
      setPenaltyPoints(1);
      
    } catch (error) {
      logger.error('Penalty issuance failed:', error);
      setError(error.message || 'Failed to issue penalty');
    } finally {
      setLoading(false);
    }
  };

  // Handle behavior recording
  const handleRecordBehavior = async () => {
    if (!student?.uid || !selectedClass || !behaviorType) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const behaviorInfo = behaviorTypes.find(b => b.value === behaviorType);
      
      // Create behavior record
      const behaviorRef = doc(collection(db, 'behaviors'));
      const behaviorData = {
        studentId: student.uid,
        classId: selectedClass,
        instructorId: user.uid,
        type: behaviorType,
        severity: behaviorSeverity,
        note: behaviorNote,
        createdAt: serverTimestamp(),
        method: 'qr_manual'
      };
      
      await setDoc(behaviorRef, behaviorData);
      
      // Send notification for high severity behaviors
      if (behaviorSeverity === 'high') {
        await addNotification({
          userId: student.uid,
          title: 'Behavior Record',
          message: `A behavior note has been recorded: ${behaviorInfo?.label || behaviorType}${behaviorNote ? ' - ' + behaviorNote : ''}`,
          type: RECORD_TYPES.BEHAVIOR,
          classId: selectedClass,
          data: behaviorData
        });
      }
      
      setSuccess(`Behavior recorded: ${behaviorInfo?.label || behaviorType} for ${student.displayName}`);
      
      if (onSuccess) {
        onSuccess({
          type: RECORD_TYPES.BEHAVIOR,
          data: {
            type: behaviorType,
            severity: behaviorSeverity,
            classId: selectedClass,
            note: behaviorNote
          }
        });
      }
      
      // Reset form
      setBehaviorNote('');
      setBehaviorType('');
      setBehaviorSeverity('medium');
      
    } catch (error) {
      logger.error('Behavior recording failed:', error);
      setError(error.message || 'Failed to record behavior');
    } finally {
      setLoading(false);
    }
  };

  // Toggle collapsed sections
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Reset all forms
  const resetForms = () => {
    setAttendanceStatus('present');
    setAttendanceNote('');
    setParticipationDelta(1);
    setParticipationNote('');
    setPenaltyType('');
    setPenaltyNote('');
    setPenaltyPoints(1);
    setBehaviorType('');
    setBehaviorNote('');
    setBehaviorSeverity('medium');
    setError('');
    setSuccess('');
  };

  // Close modal
  const handleClose = () => {
    resetForms();
    onClose();
  };

  if (!isOpen || !student) return null;

  return (
    <div className={`quick-action-modal-overlay ${isDark ? 'dark' : 'light'} ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="quick-action-modal compact">
        {/* Compact Header */}
        <div className="compact-header">
          <div className="student-mini">
            <div className="student-avatar">
              {student.displayName?.charAt(0)?.toUpperCase() || student.email?.charAt(0)?.toUpperCase()}
            </div>
            <div className="student-info">
              <div className="student-name">{student.displayName || 'Unknown Student'}</div>
              <div className="student-email">{student.email}</div>
            </div>
          </div>
          
          <button onClick={handleClose} className="compact-close">
            <X size={16} />
          </button>
        </div>

        {/* Compact Content */}
        <div className="compact-content">
          {/* Program Selection */}
          <Select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            options={[
              { value: '', label: 'Select Program' },
              ...programs.map(program => ({
                value: program,
                label: program
              }))
            ]}
            placeholder="Program"
            searchable={true}
            size="small"
          />
          
          {/* Class Selection */}
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: '', label: 'Select Class' },
              ...filteredClasses.map(cls => ({
                value: cls.id,
                label: `${cls.name || cls.code} - ${cls.status || 'Active'}`
              }))
            ]}
            placeholder="Class"
            searchable={true}
            size="small"
          />
          
          {/* Subject Selection */}
          <Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            options={[
              { value: '', label: 'Select Subject' },
              ...subjects.map(subject => ({
                value: subject,
                label: subject
              }))
            ]}
            placeholder="Subject"
            searchable={true}
            size="small"
          />
          
          {/* Status Display */}
          {selectedClass && (
            <div className="class-status">
              <span className={`status-indicator ${student.disabled ? 'disabled' : 'active'}`}>
                {student.disabled ? 'Disabled' : 'Active'}
              </span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="action-buttons">
            <Button
              onClick={handleMarkAttendance}
              disabled={!selectedClass || loading}
              variant="primary"
              size="small"
              fullWidth
            >
              <CheckCircle size={14} />
              Mark Attendance
            </Button>
            
            <Button
              onClick={handleAwardParticipation}
              disabled={!selectedClass || loading}
              variant="secondary"
              size="small"
              fullWidth
            >
              <Award size={14} />
              Add Participation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuickActionModal;


