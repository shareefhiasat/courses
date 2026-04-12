# Realistic Academic Seeding System

This system creates a comprehensive, realistic academic journey for students with proper grade distributions, behavioral records, and academic progression.

## 🎯 Overview

The realistic seeding system simulates a real university environment with:
- **2 Programs**: Computer Engineering & Mechanical Engineering
- **25 students per program** (50 total)
- **Realistic academic progression** from Spring 2025 to Spring 2026
- **Performance-based grading** (Weak, Average, Smart, Geek students)
- **Comprehensive behavioral tracking**
- **20 instructors** including Shareef Hiasat teaching CS courses
- **6 admins** (4 admins + 2 HR)

## 📚 Academic Structure

### Programs & Subjects

#### Computer Engineering (CS-ENG)
**Freshman Level (100)**
- **Spring 2025**: Intro to Programming, Python I, Discrete Math, Technical English
- **Summer 2025**: Web Development, Digital Logic
- **Fall 2025**: Data Structures & Algorithms, Python II, Computer Architecture, Calculus I
- **Spring 2026**: Database Systems, Software Engineering, Operating Systems, Computer Networks

#### Mechanical Engineering (ME-ENG)
**Freshman Level (100)**
- **Spring 2025**: Engineering Math I, Physics, Technical Drawing, Workshop Tech
- **Summer 2025**: Mechanics I, Materials Science
- **Fall 2025**: Thermodynamics, Fluid Mechanics, Engineering Math II, Manufacturing
- **Spring 2026**: Machine Design, Heat Transfer, Vibrations & Control

### 👥 User Distribution

#### Students (50 total)
- **5 Weak students** per program (20%) - GPA: 2.0-2.4
- **10 Average students** per program (40%) - GPA: 2.8-3.2
- **8 Smart students** per program (30%) - GPA: 3.5-3.8
- **2 Geek students** per program (10%) - GPA: 3.9-4.0

#### Instructors (20 total)
- **Shareef Hiasat** (Super Admin) - Teaches most CS courses
- **19 other instructors** - Specialized in their respective fields

#### Admin Staff (6 total)
- **4 Administrators** - General admin tasks
- **2 HR Managers** - HR-specific tasks

## 📊 Grade Distribution

### Performance-Based Grading

| Performance Type | Grade Range | GPA Range | Example Students |
|------------------|-------------|-----------|------------------|
| **Weak** | 55-69% | 2.0-2.4 | ahmed.weak, fatima.struggle |
| **Average** | 70-84% | 2.8-3.2 | sara.average, omar.normal |
| **Smart** | 85-94% | 3.5-3.8 | yousef.bright, aisha.intelligent |
| **Geek** | 95-100% | 3.9-4.0 | ali.genius, maryam.brilliant |

### Grade Point System
- **95-100%**: 4.0 GPA points
- **90-94%**: 3.7 GPA points
- **85-89%**: 3.3 GPA points
- **80-84%**: 3.0 GPA points
- **75-79%**: 2.7 GPA points
- **70-74%**: 2.3 GPA points
- **65-69%**: 2.0 GPA points
- **60-64%**: 1.7 GPA points
- **55-59%**: 1.3 GPA points

## 📋 Behavioral Records

### Penalty Types (Higher chance for weak/average students)
- **Late Submission** - Assignment/project submitted after deadline
- **Absence** - Unexcused absence from lectures/labs
- **Misconduct** - Disruptive classroom behavior
- **Cheating** - Academic dishonesty during exams
- **Sleep Mobile** - Sleeping in class, using mobile phone

### Behavior Types (Balanced distribution)
- **Positive** (Excellent Participation, Helping Peers, Leadership) - +3 to +5 points
- **Negative** (Disruptive, Unprepared) - -1 to -3 points

### Participation Types (High participation rate)
- **Positive** (Excellent work, Active engagement) - +3 to +5 points
- **Negative** (Late arrival) - -1 to -3 points

## 🎓 Key Features

### Realistic Academic Journey
- Students progress through terms logically
- Course prerequisites are respected
- Grade distributions reflect real university patterns
- Behavioral records vary by student performance type

### Shareef Hiasat's Teaching Load
Shareef (Super Admin) teaches core CS courses:
- Introduction to Programming
- Python Programming I & II
- Web Development Fundamentals
- Data Structures and Algorithms

### Class Structure
- **25 students maximum** per class
- **1 section per subject** per term
- **Dedicated instructor** for each class
- **Term-based progression** (Spring → Summer → Fall → Spring)

### Behavioral Patterns
- **Weak students**: 40% penalty chance, lower participation
- **Average students**: 40% penalty chance, moderate participation
- **Smart students**: 20% penalty chance, high participation
- **Geek students**: 20% penalty chance, excellent participation

## 🚀 Usage Instructions

### Quick Start (Recommended)
```bash
# Complete reset and realistic seeding
pnpm db:reset:realistic
```

### Manual Steps
```bash
# 1. Install dependencies
pnpm install

# 2. Reset database completely
pnpm db:reset

# 3. Run basic seed
pnpm db:seed

# 4. Run realistic academic seed
pnpm db:seed:realistic
```

### Start Application
```bash
# Start frontend
pnpm dev

# Start backend API
pnpm api:dev
```

## 📈 Expected Results

### Database Statistics
- **Users**: ~77 total (1 super admin + 19 instructors + 6 admins + 50 students + 1 existing)
- **Programs**: 2 (CS-ENG, ME-ENG)
- **Subjects**: 15 per program (30 total)
- **Classes**: ~60 (15 subjects × 4 terms × 2 programs)
- **Enrollments**: ~750 (50 students × ~15 subjects each)
- **Grades**: ~750 (one per enrollment)
- **Penalties**: ~300-400
- **Behaviors**: ~400-500
- **Participations**: ~500-600

### Grade Distribution
- **A grades (90-100%)**: ~10% (mostly geek/smart students)
- **B grades (80-89%)**: ~30% (smart students)
- **C grades (70-79%)**: ~40% (average students)
- **D/F grades (0-69%)**: ~20% (weak students)

## 🔍 Verification

### Check the Application
1. Navigate to: `http://localhost:5174/dashboard`
2. Login as: `shareef.hiasat@gmail.com`
3. Check these tabs:
   - **Marks**: View grade distributions and student performance
   - **Penalties**: See behavioral issues
   - **Participation**: Check class engagement
   - **Behavior**: Monitor positive/negative behaviors

### Database Inspection
```bash
# Open Prisma Studio
pnpm db:studio

# Check key tables:
# - users (student/instructor distribution)
# - marks (grade distribution)
# - penalties (behavioral issues)
# - behaviors (positive/negative behaviors)
# - participations (class engagement)
```

### API Verification
```bash
# Check grades
curl http://localhost:8001/api/v1/marks

# Check penalties
curl http://localhost:8001/api/v1/penalties

# Check behaviors
curl http://localhost:8001/api/v1/behaviors

# Check participations
curl http://localhost:8001/api/v1/participations
```

## 🎨 Realistic Scenarios Created

### Student Profiles Examples

#### Weak Student (ahmed.weak@military-lms.com)
- **GPA**: 2.1
- **Grades**: 55-69% range
- **Behavior**: More penalties, less participation
- **Pattern**: Struggles with programming concepts

#### Average Student (sara.average@military-lms.com)
- **GPA**: 3.0
- **Grades**: 70-84% range
- **Behavior**: Moderate penalties, good participation
- **Pattern**: Consistent but not exceptional

#### Smart Student (yousef.bright@military-lms.com)
- **GPA**: 3.6
- **Grades**: 85-94% range
- **Behavior**: Few penalties, high participation
- **Pattern**: Strong academic performance

#### Geek Student (ali.genius@military-lms.com)
- **GPA**: 3.9
- **Grades**: 95-100% range
- **Behavior**: Minimal penalties, excellent participation
- **Pattern**: Exceptional across all subjects

## 🔄 Reset and Re-run

If you need to reset everything:
```bash
# Complete reset and reseeding
pnpm db:reset:realistic
```

This will:
1. **Delete all existing data**
2. **Recreate the schema**
3. **Run basic seeding**
4. **Generate realistic academic data**

## 🎯 Educational Benefits

This realistic seeding system provides:
- **Performance diversity** for testing grade distributions
- **Behavioral patterns** for testing student management
- **Academic progression** for testing curriculum planning
- **Instructor workload** for testing faculty management
- **Real scenarios** for testing LMS features

Perfect for:
- **Development testing** with realistic data
- **Demo presentations** with believable student journeys
- **Performance testing** with appropriate data volumes
- **Feature testing** with varied student scenarios
