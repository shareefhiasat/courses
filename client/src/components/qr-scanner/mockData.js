// Mock data for QR Scanner page

export const mockStudents = [
  {
    id: '1',
    studentId: '249001',
    name: 'Ronel Hiasat',
    attendance: 'present',
    participation: 12,
    behavior: 5,
    penalty: 0,
    isPinned: true,
    behaviorHistory: [
      {
        type: 'participation',
        points: 1,
        timestamp: new Date(),
        note: 'Volunteered for demo'
      }
    ]
  },
  {
    id: '2',
    studentId: '249015',
    name: 'Sarah Jenkins',
    attendance: 'late',
    participation: 8,
    behavior: 0,
    penalty: -2,
    isPinned: false,
    behaviorHistory: []
  },
  {
    id: '3',
    studentId: '249022',
    name: 'Michael Chen',
    attendance: 'absent',
    participation: 0,
    behavior: 0,
    penalty: 0,
    isPinned: false,
    behaviorHistory: []
  },
  {
    id: '4',
    studentId: '249045',
    name: 'Emma Larson',
    attendance: 'present',
    participation: 4,
    behavior: 2,
    penalty: 0,
    isPinned: false,
    behaviorHistory: []
  },
  {
    id: '5',
    studentId: '249033',
    name: 'David Martinez',
    attendance: 'present',
    participation: 15,
    behavior: 3,
    penalty: -1,
    isPinned: false,
    behaviorHistory: []
  },
  {
    id: '6',
    studentId: '249056',
    name: 'Sophia Anderson',
    attendance: 'present',
    participation: 7,
    behavior: 1,
    penalty: 0,
    isPinned: false,
    behaviorHistory: []
  },
  {
    id: '7',
    studentId: '249067',
    name: 'James Wilson',
    attendance: 'late',
    participation: 3,
    behavior: 0,
    penalty: -1,
    isPinned: false,
    behaviorHistory: []
  },
  {
    id: '8',
    studentId: '249078',
    name: 'Olivia Brown',
    attendance: 'present',
    participation: 11,
    behavior: 4,
    penalty: 0,
    isPinned: false,
    behaviorHistory: []
  },
  {
    id: '9',
    studentId: '249089',
    name: 'Liam Johnson',
    attendance: 'present',
    participation: 6,
    behavior: 2,
    penalty: 0,
    isPinned: false,
    behaviorHistory: []
  },
  {
    id: '10',
    studentId: '249090',
    name: 'Ava Davis',
    attendance: 'present',
    participation: 9,
    behavior: 3,
    penalty: 0,
    isPinned: false,
    behaviorHistory: []
  },
];
