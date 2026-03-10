/**
 * Swagger API Documentation Configuration
 * Auto-generates API documentation from JSDoc comments
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Military LMS API',
    version: '1.0.0',
    description: 'Complete API documentation for Military Learning Management System',
    contact: {
      name: 'Military LMS Support',
      email: 'support@milmanylms.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.milmanylms.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key for authentication',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      },
    },
    schemas: {
      Program: {
        type: 'object',
        required: ['nameEn', 'code'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          nameEn: {
            type: 'string',
            description: 'Program name in English',
            example: 'Computer Science',
          },
          nameAr: {
            type: 'string',
            description: 'Program name in Arabic',
            example: 'علوم الحاسوب',
          },
          code: {
            type: 'string',
            description: 'Program code',
            example: 'CS101',
          },
          descriptionEn: {
            type: 'string',
            description: 'Program description in English',
            example: 'Computer Science program',
          },
          descriptionAr: {
            type: 'string',
            description: 'Program description in Arabic',
            example: 'برنامج علوم الحاسوب',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether program is active',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ProgramInput: {
        type: 'object',
        required: ['nameEn', 'code'],
        properties: {
          nameEn: {
            type: 'string',
            description: 'Program name in English',
            example: 'Computer Science',
          },
          nameAr: {
            type: 'string',
            description: 'Program name in Arabic',
            example: 'علوم الحاسوب',
          },
          code: {
            type: 'string',
            description: 'Program code',
            example: 'CS101',
          },
          descriptionEn: {
            type: 'string',
            description: 'Program description in English',
          },
          descriptionAr: {
            type: 'string',
            description: 'Program description in Arabic',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether program is active',
            default: true,
          },
        },
      },
      Subject: {
        type: 'object',
        required: ['nameEn', 'code', 'programId'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          nameEn: {
            type: 'string',
            description: 'Subject name in English',
            example: 'Advanced Mathematics',
          },
          nameAr: {
            type: 'string',
            description: 'Subject name in Arabic',
            example: 'الرياضيات المتقدمة',
          },
          code: {
            type: 'string',
            description: 'Subject code',
            example: 'MATH201',
          },
          programId: {
            type: 'string',
            description: 'Associated program ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          descriptionEn: {
            type: 'string',
            description: 'Subject description in English',
            example: 'Advanced mathematics course',
          },
          descriptionAr: {
            type: 'string',
            description: 'Subject description in Arabic',
            example: 'دورة الرياضيات المتقدمة',
          },
          credits: {
            type: 'integer',
            description: 'Credit hours',
            example: 3,
          },
          isActive: {
            type: 'boolean',
            description: 'Whether subject is active',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      SubjectInput: {
        type: 'object',
        required: ['nameEn', 'code', 'programId'],
        properties: {
          nameEn: {
            type: 'string',
            description: 'Subject name in English',
            example: 'Advanced Mathematics',
          },
          nameAr: {
            type: 'string',
            description: 'Subject name in Arabic',
            example: 'الرياضيات المتقدمة',
          },
          code: {
            type: 'string',
            description: 'Subject code',
            example: 'MATH201',
          },
          programId: {
            type: 'string',
            description: 'Associated program ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          descriptionEn: {
            type: 'string',
            description: 'Subject description in English',
          },
          descriptionAr: {
            type: 'string',
            description: 'Subject description in Arabic',
          },
          credits: {
            type: 'integer',
            description: 'Credit hours',
            default: 3,
          },
          isActive: {
            type: 'boolean',
            description: 'Whether subject is active',
            default: true,
          },
        },
      },
      Class: {
        type: 'object',
        required: ['nameEn', 'code', 'subjectId', 'programId'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          nameEn: {
            type: 'string',
            description: 'Class name in English',
            example: 'Math 101 - Section A',
          },
          nameAr: {
            type: 'string',
            description: 'Class name in Arabic',
            example: 'رياضيات 101 - القسم أ',
          },
          code: {
            type: 'string',
            description: 'Class code',
            example: 'MATH101-A',
          },
          subjectId: {
            type: 'string',
            description: 'Associated subject ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          programId: {
            type: 'string',
            description: 'Associated program ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          instructorId: {
            type: 'string',
            description: 'Instructor user ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          descriptionEn: {
            type: 'string',
            description: 'Class description in English',
            example: 'Introduction to Mathematics',
          },
          descriptionAr: {
            type: 'string',
            description: 'Class description in Arabic',
            example: 'مقدمة في الرياضيات',
          },
          schedule: {
            type: 'string',
            description: 'Class schedule',
            example: 'Mon/Wed 10:00-11:30',
          },
          room: {
            type: 'string',
            description: 'Classroom location',
            example: 'Building A - Room 201',
          },
          capacity: {
            type: 'integer',
            description: 'Maximum student capacity',
            example: 30,
          },
          isActive: {
            type: 'boolean',
            description: 'Whether class is active',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ClassInput: {
        type: 'object',
        required: ['nameEn', 'code', 'subjectId', 'programId'],
        properties: {
          nameEn: {
            type: 'string',
            description: 'Class name in English',
            example: 'Math 101 - Section A',
          },
          nameAr: {
            type: 'string',
            description: 'Class name in Arabic',
            example: 'رياضيات 101 - القسم أ',
          },
          code: {
            type: 'string',
            description: 'Class code',
            example: 'MATH101-A',
          },
          subjectId: {
            type: 'string',
            description: 'Associated subject ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          programId: {
            type: 'string',
            description: 'Associated program ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          instructorId: {
            type: 'string',
            description: 'Instructor user ID',
          },
          descriptionEn: {
            type: 'string',
            description: 'Class description in English',
          },
          descriptionAr: {
            type: 'string',
            description: 'Class description in Arabic',
          },
          schedule: {
            type: 'string',
            description: 'Class schedule',
          },
          room: {
            type: 'string',
            description: 'Classroom location',
          },
          capacity: {
            type: 'integer',
            description: 'Maximum student capacity',
            default: 30,
          },
          isActive: {
            type: 'boolean',
            description: 'Whether class is active',
            default: true,
          },
        },
      },
      Activity: {
        type: 'object',
        required: ['title', 'classId', 'subjectId'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          title: {
            type: 'string',
            description: 'Activity title',
            example: 'Week 3 Quiz',
          },
          description: {
            type: 'string',
            description: 'Activity description',
            example: 'Quiz covering chapters 3-4',
          },
          classId: {
            type: 'string',
            description: 'Associated class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          subjectId: {
            type: 'string',
            description: 'Associated subject ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Activity type',
            example: 'quiz',
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Due date',
          },
          maxScore: {
            type: 'integer',
            description: 'Maximum score',
            example: 100,
          },
          isPublished: {
            type: 'boolean',
            description: 'Whether activity is published',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ActivityInput: {
        type: 'object',
        required: ['title', 'classId', 'subjectId'],
        properties: {
          title: {
            type: 'string',
            description: 'Activity title',
            example: 'Week 3 Quiz',
          },
          description: {
            type: 'string',
            description: 'Activity description',
          },
          classId: {
            type: 'string',
            description: 'Associated class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          subjectId: {
            type: 'string',
            description: 'Associated subject ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Activity type',
            example: 'quiz',
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Due date',
          },
          maxScore: {
            type: 'integer',
            description: 'Maximum score',
            default: 100,
          },
          isPublished: {
            type: 'boolean',
            description: 'Whether activity is published',
            default: false,
          },
        },
      },
      Announcement: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          title: {
            type: 'string',
            description: 'Announcement title',
            example: 'Exam Schedule Update',
          },
          content: {
            type: 'string',
            description: 'Announcement content/body',
            example: 'The midterm exam will be held next Monday at 10:00.',
          },
          classId: {
            type: 'string',
            description: 'Optional associated class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          authorId: {
            type: 'string',
            description: 'Optional author user ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          isPublished: {
            type: 'boolean',
            description: 'Whether announcement is published',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      AnnouncementInput: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: {
            type: 'string',
            description: 'Announcement title',
            example: 'Exam Schedule Update',
          },
          content: {
            type: 'string',
            description: 'Announcement content/body',
          },
          classId: {
            type: 'string',
            description: 'Optional associated class ID',
          },
          authorId: {
            type: 'string',
            description: 'Optional author user ID',
          },
          isPublished: {
            type: 'boolean',
            description: 'Whether announcement is published',
            default: false,
          },
        },
      },
      Resource: {
        type: 'object',
        required: ['titleEn', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          titleEn: {
            type: 'string',
            description: 'Resource title in English',
            example: 'Lecture Slides - Week 1',
          },
          titleAr: {
            type: 'string',
            description: 'Resource title in Arabic',
            example: 'شرائح المحاضرة - الأسبوع 1',
          },
          descriptionEn: {
            type: 'string',
            description: 'Resource description in English',
          },
          descriptionAr: {
            type: 'string',
            description: 'Resource description in Arabic',
          },
          type: {
            type: 'string',
            description: 'Resource type',
            example: 'document',
          },
          url: {
            type: 'string',
            description: 'External URL (if any)',
            example: 'https://example.com/resource.pdf',
          },
          categoryId: {
            type: 'string',
            description: 'Optional associated category ID',
          },
          classId: {
            type: 'string',
            description: 'Optional associated class ID',
          },
          programId: {
            type: 'string',
            description: 'Optional associated program ID',
          },
          subjectId: {
            type: 'string',
            description: 'Optional associated subject ID',
          },
          fileId: {
            type: 'string',
            description: 'Optional associated file ID',
          },
          featured: {
            type: 'boolean',
            description: 'Whether the resource is featured',
            example: false,
          },
          optional: {
            type: 'boolean',
            description: 'Whether the resource is optional',
            example: true,
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Optional due date',
          },
          createdBy: {
            type: 'string',
            description: 'Optional creator user ID',
          },
          updatedBy: {
            type: 'string',
            description: 'Optional updater user ID',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ResourceInput: {
        type: 'object',
        required: ['titleEn', 'type'],
        properties: {
          titleEn: {
            type: 'string',
            description: 'Resource title in English',
            example: 'Lecture Slides - Week 1',
          },
          titleAr: {
            type: 'string',
            description: 'Resource title in Arabic',
          },
          descriptionEn: {
            type: 'string',
            description: 'Resource description in English',
          },
          descriptionAr: {
            type: 'string',
            description: 'Resource description in Arabic',
          },
          type: {
            type: 'string',
            description: 'Resource type',
            example: 'document',
          },
          url: {
            type: 'string',
            description: 'External URL (if any)',
          },
          categoryId: {
            type: 'string',
            description: 'Optional associated category ID',
          },
          classId: {
            type: 'string',
            description: 'Optional associated class ID',
          },
          programId: {
            type: 'string',
            description: 'Optional associated program ID',
          },
          subjectId: {
            type: 'string',
            description: 'Optional associated subject ID',
          },
          fileId: {
            type: 'string',
            description: 'Optional associated file ID',
          },
          featured: {
            type: 'boolean',
            description: 'Whether the resource is featured',
            default: false,
          },
          optional: {
            type: 'boolean',
            description: 'Whether the resource is optional',
            default: false,
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Optional due date',
          },
        },
      },
      User: {
        type: 'object',
        required: ['email', 'displayName'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          email: {
            type: 'string',
            description: 'User email',
            example: 'user@example.com',
          },
          displayName: {
            type: 'string',
            description: 'Display name',
            example: 'John Doe',
          },
          realName: {
            type: 'string',
            description: 'Real name',
            example: 'Johnathan Doe',
          },
          isAdmin: {
            type: 'boolean',
            description: 'Admin flag',
            example: false,
          },
          isSuperAdmin: {
            type: 'boolean',
            description: 'Super admin flag',
            example: false,
          },
          isInstructor: {
            type: 'boolean',
            description: 'Instructor flag',
            example: false,
          },
          isStudent: {
            type: 'boolean',
            description: 'Student flag',
            example: true,
          },
          isHR: {
            type: 'boolean',
            description: 'HR flag',
            example: false,
          },
          status: {
            type: 'string',
            description: 'Account status',
            example: 'active',
          },
          phoneNumber: {
            type: 'string',
            description: 'Phone number',
            example: '+962790000000',
          },
          studentNumber: {
            type: 'string',
            description: 'Student number',
            example: '20240001',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      UserInput: {
        type: 'object',
        required: ['email', 'displayName'],
        properties: {
          email: {
            type: 'string',
            description: 'User email',
            example: 'user@example.com',
          },
          displayName: {
            type: 'string',
            description: 'Display name',
            example: 'John Doe',
          },
          realName: {
            type: 'string',
            description: 'Real name',
          },
          passwordHash: {
            type: 'string',
            description: 'Optional password hash (if managed here)',
          },
          isAdmin: {
            type: 'boolean',
            description: 'Admin flag',
            default: false,
          },
          isSuperAdmin: {
            type: 'boolean',
            description: 'Super admin flag',
            default: false,
          },
          isInstructor: {
            type: 'boolean',
            description: 'Instructor flag',
            default: false,
          },
          isStudent: {
            type: 'boolean',
            description: 'Student flag',
            default: true,
          },
          isHR: {
            type: 'boolean',
            description: 'HR flag',
            default: false,
          },
          status: {
            type: 'string',
            description: 'Account status',
            default: 'active',
          },
          phoneNumber: {
            type: 'string',
            description: 'Phone number',
          },
          studentNumber: {
            type: 'string',
            description: 'Student number',
          },
        },
      },
      Penalty: {
        type: 'object',
        required: ['studentId', 'type', 'description'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          classId: {
            type: 'string',
            description: 'Optional class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          instructorId: {
            type: 'string',
            description: 'Optional instructor ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Penalty type',
            example: 'late_submission',
          },
          description: {
            type: 'string',
            description: 'Penalty description',
            example: 'Assignment submitted 2 days late',
          },
          severity: {
            type: 'string',
            description: 'Severity level',
            example: 'medium',
          },
          points: {
            type: 'integer',
            description: 'Penalty points',
            example: 5,
          },
          status: {
            type: 'string',
            description: 'Penalty status',
            example: 'active',
          },
          resolvedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Resolution timestamp',
          },
          resolvedBy: {
            type: 'string',
            description: 'Resolver user ID',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      PenaltyInput: {
        type: 'object',
        required: ['studentId', 'type', 'description'],
        properties: {
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          classId: {
            type: 'string',
            description: 'Optional class ID',
          },
          instructorId: {
            type: 'string',
            description: 'Optional instructor ID',
          },
          type: {
            type: 'string',
            description: 'Penalty type',
            example: 'late_submission',
          },
          description: {
            type: 'string',
            description: 'Penalty description',
          },
          severity: {
            type: 'string',
            description: 'Severity level',
            example: 'medium',
          },
          points: {
            type: 'integer',
            description: 'Penalty points',
          },
          status: {
            type: 'string',
            description: 'Penalty status',
            default: 'active',
          },
        },
      },
      Participation: {
        type: 'object',
        required: ['studentId', 'activityId', 'classId'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          activityId: {
            type: 'string',
            description: 'Activity ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          classId: {
            type: 'string',
            description: 'Class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Participation type',
            example: 'attendance',
          },
          score: {
            type: 'number',
            description: 'Participation score',
            example: 85.5,
          },
          maxScore: {
            type: 'number',
            description: 'Maximum possible score',
            example: 100,
          },
          status: {
            type: 'string',
            description: 'Participation status',
            example: 'present',
          },
          notes: {
            type: 'string',
            description: 'Instructor notes',
          },
          recordedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Recording timestamp',
          },
          recordedBy: {
            type: 'string',
            description: 'Recorder user ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ParticipationInput: {
        type: 'object',
        required: ['studentId', 'activityId', 'classId'],
        properties: {
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          activityId: {
            type: 'string',
            description: 'Activity ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          classId: {
            type: 'string',
            description: 'Class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Participation type',
            example: 'attendance',
          },
          score: {
            type: 'number',
            description: 'Participation score',
          },
          maxScore: {
            type: 'number',
            description: 'Maximum possible score',
          },
          status: {
            type: 'string',
            description: 'Participation status',
            default: 'present',
          },
          notes: {
            type: 'string',
            description: 'Instructor notes',
          },
          recordedBy: {
            type: 'string',
            description: 'Recorder user ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
        },
      },
      Behavior: {
        type: 'object',
        required: ['studentId', 'type', 'description'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          classId: {
            type: 'string',
            description: 'Optional class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          instructorId: {
            type: 'string',
            description: 'Optional instructor ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Behavior type',
            example: 'positive_behavior',
          },
          category: {
            type: 'string',
            description: 'Behavior category',
            example: 'academic',
          },
          description: {
            type: 'string',
            description: 'Behavior description',
            example: 'Student helped classmates with difficult concepts',
          },
          severity: {
            type: 'string',
            description: 'Severity level',
            example: 'low',
          },
          impact: {
            type: 'string',
            description: 'Impact on learning environment',
          },
          actionTaken: {
            type: 'string',
            description: 'Actions taken by instructor/admin',
          },
          status: {
            type: 'string',
            description: 'Behavior status',
            example: 'active',
          },
          reportedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Report timestamp',
          },
          reportedBy: {
            type: 'string',
            description: 'Reporter user ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          resolvedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Resolution timestamp',
          },
          resolvedBy: {
            type: 'string',
            description: 'Resolver user ID',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      BehaviorInput: {
        type: 'object',
        required: ['studentId', 'type', 'description'],
        properties: {
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          classId: {
            type: 'string',
            description: 'Optional class ID',
          },
          instructorId: {
            type: 'string',
            description: 'Optional instructor ID',
          },
          type: {
            type: 'string',
            description: 'Behavior type',
            example: 'positive_behavior',
          },
          category: {
            type: 'string',
            description: 'Behavior category',
            example: 'academic',
          },
          description: {
            type: 'string',
            description: 'Behavior description',
          },
          severity: {
            type: 'string',
            description: 'Severity level',
            example: 'low',
          },
          impact: {
            type: 'string',
            description: 'Impact on learning environment',
          },
          actionTaken: {
            type: 'string',
            description: 'Actions taken by instructor/admin',
          },
          status: {
            type: 'string',
            description: 'Behavior status',
            default: 'active',
          },
          reportedBy: {
            type: 'string',
            description: 'Reporter user ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
        },
      },
      QuizResult: {
        type: 'object',
        required: ['quizId', 'studentId', 'classId', 'score', 'maxScore', 'percentage', 'status', 'startedAt'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          quizId: {
            type: 'string',
            description: 'Quiz ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          classId: {
            type: 'string',
            description: 'Class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          score: {
            type: 'number',
            description: 'Score achieved',
            example: 85.5,
          },
          maxScore: {
            type: 'number',
            description: 'Maximum possible score',
            example: 100,
          },
          percentage: {
            type: 'number',
            description: 'Percentage score',
            example: 85.5,
          },
          status: {
            type: 'string',
            description: 'Quiz status',
            example: 'passed',
          },
          startedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Quiz start time',
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Quiz completion time',
          },
          timeSpent: {
            type: 'integer',
            description: 'Time spent in minutes',
            example: 45,
          },
          attempts: {
            type: 'integer',
            description: 'Number of attempts',
            example: 1,
          },
          feedback: {
            type: 'string',
            description: 'Quiz feedback',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      QuizResultInput: {
        type: 'object',
        required: ['quizId', 'studentId', 'classId', 'score', 'maxScore', 'percentage', 'status', 'startedAt'],
        properties: {
          quizId: {
            type: 'string',
            description: 'Quiz ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          classId: {
            type: 'string',
            description: 'Class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          score: {
            type: 'number',
            description: 'Score achieved',
            example: 85.5,
          },
          maxScore: {
            type: 'number',
            description: 'Maximum possible score',
            example: 100,
          },
          percentage: {
            type: 'number',
            description: 'Percentage score',
            example: 85.5,
          },
          status: {
            type: 'string',
            description: 'Quiz status',
            example: 'passed',
          },
          startedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Quiz start time',
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Quiz completion time',
          },
          timeSpent: {
            type: 'integer',
            description: 'Time spent in minutes',
          },
          attempts: {
            type: 'integer',
            description: 'Number of attempts',
            default: 1,
          },
          feedback: {
            type: 'string',
            description: 'Quiz feedback',
          },
        },
      },
      QuizSubmission: {
        type: 'object',
        required: ['quizResultId', 'questionId', 'studentId', 'answer', 'isCorrect', 'points', 'maxPoints'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          quizResultId: {
            type: 'string',
            description: 'Quiz result ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          questionId: {
            type: 'string',
            description: 'Question ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          answer: {
            type: 'object',
            description: 'Student answer',
            example: { "selected": "A" },
          },
          isCorrect: {
            type: 'boolean',
            description: 'Answer correctness',
            example: true,
          },
          points: {
            type: 'number',
            description: 'Points earned',
            example: 10,
          },
          maxPoints: {
            type: 'number',
            description: 'Maximum points',
            example: 10,
          },
          timeSpent: {
            type: 'integer',
            description: 'Time spent in seconds',
            example: 120,
          },
          submittedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Submission timestamp',
          },
        },
      },
      QuizSubmissionInput: {
        type: 'object',
        required: ['quizResultId', 'questionId', 'studentId', 'answer', 'isCorrect', 'points', 'maxPoints'],
        properties: {
          quizResultId: {
            type: 'string',
            description: 'Quiz result ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          questionId: {
            type: 'string',
            description: 'Question ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          studentId: {
            type: 'string',
            description: 'Student ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          answer: {
            type: 'object',
            description: 'Student answer',
          },
          isCorrect: {
            type: 'boolean',
            description: 'Answer correctness',
            example: true,
          },
          points: {
            type: 'number',
            description: 'Points earned',
            example: 10,
          },
          maxPoints: {
            type: 'number',
            description: 'Maximum points',
            example: 10,
          },
          timeSpent: {
            type: 'integer',
            description: 'Time spent in seconds',
          },
        },
      },
      Notification: {
        type: 'object',
        required: ['userId', 'title', 'message', 'type', 'category'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          userId: {
            type: 'string',
            description: 'User ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          title: {
            type: 'string',
            description: 'Notification title',
            example: 'New Assignment Posted',
          },
          message: {
            type: 'string',
            description: 'Notification message',
            example: 'A new assignment has been posted for your class',
          },
          type: {
            type: 'string',
            description: 'Notification type',
            example: 'info',
          },
          category: {
            type: 'string',
            description: 'Notification category',
            example: 'announcement',
          },
          isRead: {
            type: 'boolean',
            description: 'Read status',
            example: false,
          },
          actionUrl: {
            type: 'string',
            description: 'Action URL',
          },
          actionText: {
            type: 'string',
            description: 'Action button text',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Expiration time',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
        },
      },
      NotificationInput: {
        type: 'object',
        required: ['userId', 'title', 'message', 'type', 'category'],
        properties: {
          userId: {
            type: 'string',
            description: 'User ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          title: {
            type: 'string',
            description: 'Notification title',
          },
          message: {
            type: 'string',
            description: 'Notification message',
          },
          type: {
            type: 'string',
            description: 'Notification type',
            example: 'info',
          },
          category: {
            type: 'string',
            description: 'Notification category',
            example: 'announcement',
          },
          actionUrl: {
            type: 'string',
            description: 'Action URL',
          },
          actionText: {
            type: 'string',
            description: 'Action button text',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Expiration time',
          },
        },
      },
      Schedule: {
        type: 'object',
        required: ['title', 'instructorId', 'startDate', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          title: {
            type: 'string',
            description: 'Schedule title',
            example: 'Math Class - Chapter 5',
          },
          description: {
            type: 'string',
            description: 'Schedule description',
          },
          classId: {
            type: 'string',
            description: 'Class ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          instructorId: {
            type: 'string',
            description: 'Instructor ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Schedule type',
            example: 'class',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Start date',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'End date',
          },
          location: {
            type: 'string',
            description: 'Location',
            example: 'Room 101',
          },
          isRecurring: {
            type: 'boolean',
            description: 'Recurring flag',
            example: false,
          },
          recurrence: {
            type: 'object',
            description: 'Recurrence rules',
          },
          status: {
            type: 'string',
            description: 'Schedule status',
            example: 'active',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ScheduleInput: {
        type: 'object',
        required: ['title', 'instructorId', 'startDate', 'type'],
        properties: {
          title: {
            type: 'string',
            description: 'Schedule title',
          },
          description: {
            type: 'string',
            description: 'Schedule description',
          },
          classId: {
            type: 'string',
            description: 'Class ID',
          },
          instructorId: {
            type: 'string',
            description: 'Instructor ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Schedule type',
            example: 'class',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Start date',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'End date',
          },
          location: {
            type: 'string',
            description: 'Location',
          },
          isRecurring: {
            type: 'boolean',
            description: 'Recurring flag',
            default: false,
          },
          recurrence: {
            type: 'object',
            description: 'Recurrence rules',
          },
          status: {
            type: 'string',
            description: 'Schedule status',
            default: 'active',
          },
        },
      },
      Template: {
        type: 'object',
        required: ['name', 'type', 'createdBy'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          name: {
            type: 'string',
            description: 'Template name',
            example: 'Quiz Template',
          },
          description: {
            type: 'string',
            description: 'Template description',
          },
          type: {
            type: 'string',
            description: 'Template type',
            example: 'quiz',
          },
          content: {
            type: 'object',
            description: 'Template content structure',
          },
          variables: {
            type: 'object',
            description: 'Template variables',
          },
          createdBy: {
            type: 'string',
            description: 'Creator ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          isActive: {
            type: 'boolean',
            description: 'Active status',
            example: true,
          },
          usageCount: {
            type: 'integer',
            description: 'Usage count',
            example: 15,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      TemplateInput: {
        type: 'object',
        required: ['name', 'type', 'createdBy'],
        properties: {
          name: {
            type: 'string',
            description: 'Template name',
          },
          description: {
            type: 'string',
            description: 'Template description',
          },
          type: {
            type: 'string',
            description: 'Template type',
            example: 'quiz',
          },
          content: {
            type: 'object',
            description: 'Template content structure',
          },
          variables: {
            type: 'object',
            description: 'Template variables',
          },
          createdBy: {
            type: 'string',
            description: 'Creator ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          isActive: {
            type: 'boolean',
            description: 'Active status',
            default: true,
          },
        },
      },
      Gamification: {
        type: 'object',
        required: ['userId', 'type', 'name'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          userId: {
            type: 'string',
            description: 'User ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Gamification type',
            example: 'points',
          },
          name: {
            type: 'string',
            description: 'Achievement name',
            example: 'First Quiz Completed',
          },
          description: {
            type: 'string',
            description: 'Achievement description',
          },
          value: {
            type: 'integer',
            description: 'Points value',
            example: 100,
          },
          criteria: {
            type: 'object',
            description: 'Achievement criteria',
          },
          earnedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Earned timestamp',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Expiration time',
          },
          isActive: {
            type: 'boolean',
            description: 'Active status',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
        },
      },
      GamificationInput: {
        type: 'object',
        required: ['userId', 'type', 'name'],
        properties: {
          userId: {
            type: 'string',
            description: 'User ID',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          type: {
            type: 'string',
            description: 'Gamification type',
            example: 'points',
          },
          name: {
            type: 'string',
            description: 'Achievement name',
          },
          description: {
            type: 'string',
            description: 'Achievement description',
          },
          value: {
            type: 'integer',
            description: 'Points value',
          },
          criteria: {
            type: 'object',
            description: 'Achievement criteria',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Expiration time',
          },
          isActive: {
            type: 'boolean',
            description: 'Active status',
            default: true,
          },
        },
      },
      Category: {
        type: 'object',
        required: ['nameEn', 'nameAr', 'icon', 'color', 'order'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          nameEn: {
            type: 'string',
            description: 'Category name in English',
            example: 'Mathematics',
          },
          nameAr: {
            type: 'string',
            description: 'Category name in Arabic',
            example: 'الرياضيات',
          },
          icon: {
            type: 'string',
            description: 'Icon name or emoji',
            example: 'calculator',
          },
          descriptionEn: {
            type: 'string',
            description: 'Category description in English',
            example: 'Mathematics courses and tutorials',
          },
          descriptionAr: {
            type: 'string',
            description: 'Category description in Arabic',
            example: 'دورات ودروس الرياضيات',
          },
          color: {
            type: 'string',
            description: 'Hex color code',
            example: '#3B82F6',
          },
          order: {
            type: 'integer',
            description: 'Display order',
            example: 1,
          },
          isActive: {
            type: 'boolean',
            description: 'Whether category is active',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the operation was successful',
            example: true,
          },
          data: {
            type: 'array',
            description: 'Response data',
            items: {
              $ref: '#/components/schemas/Category',
            },
          },
          count: {
            type: 'integer',
            description: 'Number of items in data array',
            example: 5,
          },
          error: {
            type: 'string',
            description: 'Error message (if success is false)',
            example: 'Category not found',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Validation failed',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status',
    },
    {
      name: 'Categories',
      description: 'Category management operations',
    },
    {
      name: 'Programs',
      description: 'Program management operations',
    },
    {
      name: 'Subjects',
      description: 'Subject management operations',
    },
    {
      name: 'Classes',
      description: 'Class management operations',
    },
    {
      name: 'Activities',
      description: 'Activity management operations',
    },
    {
      name: 'Announcements',
      description: 'Announcement management operations',
    },
    {
      name: 'Resources',
      description: 'Resource management operations',
    },
    {
      name: 'Users',
      description: 'User management operations',
    },
    {
      name: 'Penalties',
      description: 'Penalty management operations',
    },
    {
      name: 'Participations',
      description: 'Participation tracking operations',
    },
    {
      name: 'Behaviors',
      description: 'Behavior tracking operations',
    },
    {
      name: 'Quiz Results',
      description: 'Quiz results management operations',
    },
    {
      name: 'Quiz Submissions',
      description: 'Quiz submissions tracking operations',
    },
    {
      name: 'Notifications',
      description: 'Notification management operations',
    },
    {
      name: 'Schedules',
      description: 'Schedule management operations',
    },
    {
      name: 'Templates',
      description: 'Template management operations',
    },
    {
      name: 'Gamifications',
      description: 'Gamification operations',
    },
    {
      name: 'Authentication',
      description: 'Authentication and authorization',
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: [
    './pages/api/**/*.cjs',          // API routes
    './src/services/**/*.js',        // Service files
    './src/utils/**/*.js',           // Utility files
  ],
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(options);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Military LMS API Documentation',
  customfavIcon: '/favicon.ico',
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions,
};
