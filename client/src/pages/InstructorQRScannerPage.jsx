import React, { useState } from 'react';
import TopBar from '../components/qr-scanner/TopBar';
import QRScanner from '../components/qr-scanner/QRScanner';
import StudentRoster from '../components/qr-scanner/StudentRoster';
import StudentActionPanel from '../components/qr-scanner/StudentActionPanel';
import { mockStudents } from '../components/qr-scanner/mockData';
import '../components/qr-scanner/ui/qr-scanner-ui.css';

const InstructorQRScannerPage = () => {
  const [students, setStudents] = useState(mockStudents);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleScan = (studentId) => {
    const student = students.find(s => s.studentId === studentId);
    if (student) {
      setSelectedStudent(student);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handleBehaviorSubmit = (studentId, actions, note) => {
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.id === studentId) {
          const totalPoints = actions.reduce((sum, action) => sum + action.points, 0);
          const updatedHistory = [
            ...student.behaviorHistory,
            ...actions.map(action => ({
              ...action,
              note
            }))
          ];
          
          return {
            ...student,
            behavior: student.behavior + totalPoints,
            penalty: totalPoints < 0 ? student.penalty + totalPoints : student.penalty,
            behaviorHistory: updatedHistory
          };
        }
        return student;
      })
    );
    
    // Update selected student to reflect changes
    const updatedStudent = students.find(s => s.id === studentId);
    if (updatedStudent) {
      setSelectedStudent({
        ...updatedStudent,
        behaviorHistory: [
          ...updatedStudent.behaviorHistory,
          ...actions.map(action => ({
            ...action,
            note
          }))
        ]
      });
    }
  };

  const handleClosePanel = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="qr-scanner-container" style={{
      minHeight: '100vh',
      background: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <TopBar
        currentSubject="Computer Science"
        currentClass="Advanced Web Design"
        currentSection="Section A - Morning"
      />
      
      <div style={{
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: selectedStudent ? '1fr 400px' : '1fr',
        gap: '1.5rem',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <QRScanner onScan={handleScan} />
          <StudentRoster
            students={students}
            onStudentSelect={handleStudentSelect}
            selectedStudentId={selectedStudent?.id}
          />
        </div>
        
        {selectedStudent && (
          <div style={{
            position: 'sticky',
            top: '1.5rem',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 3rem)'
          }}>
            <StudentActionPanel
              student={selectedStudent}
              onClose={handleClosePanel}
              onBehaviorSubmit={handleBehaviorSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorQRScannerPage;
