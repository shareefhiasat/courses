# Linear Label Guide — Runbook

## All Labels

### Module Labels (40)
| Label | Color | Description |
|-------|-------|-------------|
| `module:auth` | #4EA7FC | Authentication & authorization |
| `module:programs` | #00C292 | Programs management |
| `module:subjects` | #00C292 | Subjects management |
| `module:classes` | #00C292 | Classes management |
| `module:enrollments` | #00C292 | Enrollments |
| `module:activities` | #F59E0B | Activities |
| `module:resources` | #F59E0B | Resources |
| `module:announcements` | #F59E0B | Announcements |
| `module:quizzes` | #8B5CF6 | Quizzes & assessments |
| `module:attendance` | #EF4444 | Attendance |
| `module:standup-attendance` | #EF4444 | Standup attendance |
| `module:penalties` | #EF4444 | Penalties |
| `module:participations` | #EF4444 | Participations |
| `module:behaviors` | #EF4444 | Behaviors |
| `module:marks` | #F59E0B | Marks & grading |
| `module:chat` | #06B6D4 | Chat |
| `module:notifications` | #06B6D4 | Notifications |
| `module:drive` | #3B82F6 | Smart Drive |
| `module:workflow` | #A855F7 | Workflow documents |
| `module:classrooms` | #10B981 | Classrooms |
| `module:time-slots` | #10B981 | Time slots |
| `module:holidays` | #10B981 | Holidays |
| `module:teacher-availability` | #10B981 | Teacher availability |
| `module:schedule-sessions` | #10B981 | Schedule sessions |
| `module:scheduling-summary` | #10B981 | Scheduling summary |
| `module:classroom-availability` | #10B981 | Classroom availability |
| `module:admin-scopes` | #6366F1 | Admin scopes |
| `module:dashboard` | #6366F1 | Dashboard & analytics |
| `module:lookup` | #6B7280 | Lookup management |
| `module:user-images` | #6B7280 | User images |
| `module:permissions` | #6366F1 | Permissions |
| `module:weekly-summary` | #6366F1 | Weekly summary |
| `module:audit-export` | #6B7280 | Audit export |
| `module:attendance-amendment` | #EF4444 | Attendance amendment |
| `module:instructor-history` | #10B981 | Instructor history |
| `module:users` | #6366F1 | User management |
| `module:profile` | #6B7280 | Profile & settings |
| `module:i18n` | #F97316 | Localization |
| `module:rbac` | #DC2626 | Role-based access control |
| `module:help` | #6B7280 | Help system |

### Role Labels (5)
| Label | Color | Description |
|-------|-------|-------------|
| `role:super_admin` | #DC2626 | Bug triggers when super_admin logged in |
| `role:admin` | #8B5CF6 | Bug triggers when admin logged in |
| `role:hr` | #F59E0B | Bug triggers when HR logged in |
| `role:instructor` | #06B6D4 | Bug triggers when instructor logged in |
| `role:student` | #10B981 | Bug triggers when student logged in |

### Priority Labels (4)
| Label | Color | Description |
|-------|-------|-------------|
| `priority:critical` | #DC2626 | Critical — security/data loss |
| `priority:high` | #F59E0B | High — core flow broken |
| `priority:medium` | #3B82F6 | Medium — workaround exists |
| `priority:low` | #94A3B8 | Low — cosmetic/minor |

### Type Labels (3)
| Label | Color | Description |
|-------|-------|-------------|
| `type:api` | #94A3B8 | API test |
| `type:ui` | #94A3B8 | UI test |
| `type:integration` | #94A3B8 | Integration test |

### Category Labels (4)
| Label | Color | Description |
|-------|-------|-------------|
| `Bug` | #EB5757 | Bug report |
| `Feature` | #BB87FC | Feature request |
| `Improvement` | #4EA7FC | Improvement |
| `qa` | #E0E7FF | QA / testing task |

## Label Combinations Example

A bug found in the chat module where students can see all class rooms:
```
Labels: Bug, module:chat, module:rbac, role:student, priority:high
```

A bug where admin gets a stack trace from drive:
```
Labels: Bug, module:drive, role:admin, priority:medium
```
