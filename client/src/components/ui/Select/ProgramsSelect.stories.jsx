import React, { useState } from 'react';
import ProgramsSelect from './ProgramsSelect';

// Mock data for testing
const mockPrograms = [
  { docId: 'xMh3Tqzg4stjRohjwCGX', name_en: 'Information Technology Diploma', name_ar: 'دبلوم تقنية المعلومات', code: 'CS' },
  { docId: 'abc123', name_en: 'Business Administration', name_ar: 'إدارة الأعمال', code: 'BA' },
  { docId: 'def456', name_en: 'Computer Science', name_ar: 'علوم الحاسوب', code: 'CS' }
];

const mockSubjects = [
  { docId: 'sub1', name_en: 'Database Management', name_ar: 'إدارة قواعد البيانات', programId: 'xMh3Tqzg4stjRohjwCGX' },
  { docId: 'sub2', name_en: 'Web Development', name_ar: 'تطوير الويب', programId: 'xMh3Tqzg4stjRohjwCGX' },
  { docId: 'sub3', name_en: 'Marketing', name_ar: 'التسويق', programId: 'abc123' }
];

const mockClasses = [
  { docId: 'class1', name: 'Database I', code: 'DB101', term: 'Fall 2025', subjectId: 'sub1' },
  { docId: 'class2', name: 'Web Dev I', code: 'WEB101', term: 'Fall 2025', subjectId: 'sub2' },
  { docId: 'class3', name: 'Marketing I', code: 'MKT101', term: 'Fall 2025', subjectId: 'sub3' }
];

// Mock component for testing
const MockProgramsSelect = ({ programs = [], subjects = [], classes = [], onChange }) => {
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const programOptions = [
    { value: '', label: 'All Programs' },
    ...programs.map(program => ({
      value: program.docId || program.id,
      label: program.name_en || program.name || 'Unnamed Program'
    }))
  ];

  const subjectOptions = [
    { value: '', label: 'All Subjects' },
    ...subjects
      .filter(subject => !selectedProgram || subject.programId === selectedProgram)
      .map(subject => ({
        value: subject.docId || subject.id,
        label: subject.name_en || subject.name || 'Unnamed Subject'
      }))
  ];

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classes
      .filter(classItem => !selectedSubject || classItem.subjectId === selectedSubject)
      .map(classItem => ({
        value: classItem.docId || classItem.id,
        label: `${classItem.name || classItem.code || 'Unnamed'}${classItem.code ? ` (${classItem.code})` : ''}${classItem.term ? ` - ${classItem.term}` : ''}`
      }))
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Programs Dropdown Test</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Program:
        </label>
        <select
          value={selectedProgram}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedProgram(value);
            setSelectedSubject(''); // Clear dependent fields
            setSelectedClass('');
            onChange?.({ program: value, subject: '', class: '' });
          }}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          {programOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Subject:
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedSubject(value);
            setSelectedClass(''); // Clear dependent field
            onChange?.({ program: selectedProgram, subject: value, class: '' });
          }}
          disabled={!selectedProgram}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          {subjectOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Class:
        </label>
        <select
          value={selectedClass}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedClass(value);
            onChange?.({ program: selectedProgram, subject: selectedSubject, class: value });
          }}
          disabled={!selectedSubject}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          {classOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4>Current Selection:</h4>
        <p>Program: {selectedProgram || 'None'}</p>
        <p>Subject: {selectedSubject || 'None'}</p>
        <p>Class: {selectedClass || 'None'}</p>
      </div>
    </div>
  );
};

export default {
  title: 'UI/Select/ProgramsSelect',
  component: MockProgramsSelect,
  argTypes: {
    programs: { control: 'array' },
    subjects: { control: 'array' },
    classes: { control: 'array' },
    onChange: { action: 'changed' }
  }
};

export const Default = {
  args: {
    programs: mockPrograms,
    subjects: mockSubjects,
    classes: mockClasses
  }
};

export const EmptyState = {
  args: {
    programs: [],
    subjects: [],
    classes: []
  }
};

export const SingleProgram = {
  args: {
    programs: [mockPrograms[0]], // Only IT Diploma
    subjects: mockSubjects.filter(s => s.programId === 'xMh3Tqzg4stjRohjwCGX'),
    classes: mockClasses.filter(c => ['class1', 'class2'].includes(c.docId))
  }
};

export const NoData = {
  args: {
    programs: [],
    subjects: [],
    classes: []
  }
};
