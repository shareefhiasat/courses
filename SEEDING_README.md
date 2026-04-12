# Comprehensive Database Seeding

This document explains how to use the comprehensive seeding system to populate your LMS database with extensive test data.

## Overview

The comprehensive seeding system generates realistic test data for:
- **20 students** across multiple programs
- **Penalty records** (late submissions, absences, misconduct, etc.)
- **Behavior records** (positive and negative behaviors)
- **Participation records** (class participation, helpfulness, etc.)
- **Multiple academic terms** from Fall 2024 to Fall 2026
- **Various classes** for each subject in each term

## Academic Terms Covered

The seeding creates data for these academic terms:
- **Fall 2024** (Sep - Dec 2024)
- **Spring 2025** (Jan - May 2025)  
- **Summer 2025** (Jun - Aug 2025)
- **Fall 2025** (Sep - Dec 2025)
- **Spring 2026** (Jan - May 2026)
- **Summer 2026** (Jun - Aug 2026)
- **Fall 2026** (Sep - Dec 2026)

## Student Population

The seeding creates data for 20 students across three engineering programs:

### Computer Engineering (CS-ENG)
- Ahmed Almulla
- Fatima Alhashmi
- Mohammed Alrashid
- Nora Khalifa
- Hassan Alnuaimi
- Sara Almehairi
- Sultan Alhammadi
- Ameera Alhammadi

### Mechanical Engineering (ME-ENG)
- Khalid Alsaadi
- Layla Ahmad
- Abdullah Khalifa
- Mariam Alali
- Saeed Albalushi
- Khawla Alshamsi

### Electrical Engineering (EE-ENG)
- Omar Alshammari
- Noura Alfahad
- Yousef Almarzooqi
- Aisha Almansoori
- Mansour Alqassimi
- Shamma Alsuwaidi

## Record Types Generated

### Penalty Records
Each student gets 5-15 penalty records per class with:
- **Late Submission**: Assignment submitted after deadline
- **Absence**: Unexcused absence from lecture/lab
- **Misconduct**: Disruptive classroom behavior
- **Cheating**: Academic dishonesty during exams
- **Plagiarism**: Copied work from sources
- **Disruption**: Causing disturbances in class
- **Dress Code**: Violation of dress code policies

### Behavior Records
Each student gets 5-15 behavior records per class with:
- **Positive Behaviors** (+3 to +5 points):
  - Excellent Participation
  - Helping Peers
  - Leadership
  - Creativity
  - Significant Improvement
- **Negative Behaviors** (-1 to -5 points):
  - Disruptive Behavior
  - Disrespectful Conduct
  - Unprepared for Class

### Participation Records
Each student gets 5-15 participation records per class with:
- **Positive Participation** (+3 to +5 points)
- **Late Arrival** (-1 to -3 points)
- **Helpful Behavior** (+3 to +5 points)
- **Disruptive Behavior** (-1 to -3 points)
- **Excellent Work** (+3 to +5 points)

## Usage Instructions

### Prerequisites

1. Make sure your PostgreSQL database is running
2. Ensure you have run the basic seed first:
   ```bash
   pnpm db:seed
   ```

### Install Dependencies

```bash
pnpm install
```

### Run Comprehensive Seeding

```bash
# Run the comprehensive data seeding
pnpm db:seed:comprehensive
```

### Expected Output

The seeding will generate approximately:
- **500-800 penalty records** across all students
- **600-900 behavior records** across all students  
- **800-1200 participation records** across all students
- **50-70 classes** across all terms and subjects

## Data Distribution

### Randomization Features

- **Dates**: Records are randomly distributed throughout each academic term
- **Types**: Different record types are randomly assigned with realistic probabilities
- **Comments**: Varied, realistic comments for each record type
- **Points**: Point values vary based on record severity and type

### Probability Distribution

- **Penalties**: 30% chance per record slot
- **Behaviors**: 40% chance per record slot
- **Participations**: 50% chance per record slot

## Database Schema Updates

The seeding automatically:
- Updates academic terms to include all terms until Fall 2026
- Creates additional classes for each subject in each term
- Generates records with proper foreign key relationships
- Maintains data integrity with proper constraints

## Verification

After seeding, you can verify the data by:

1. **Checking Record Counts**:
   ```bash
   pnpm db:studio
   ```
   Then browse the penalties, behaviors, and participations tables

2. **Running the Application**:
   ```bash
   pnpm dev
   ```
   Navigate to the dashboard and check the Penalty, Participation, and Behavior tabs

3. **API Verification**:
   ```bash
   curl http://localhost:8001/api/v1/penalties
   curl http://localhost:8001/api/v1/behaviors
   curl http://localhost:8001/api/v1/participations
   ```

## Troubleshooting

### Common Issues

1. **"Student not found" errors**: Make sure the basic seed has been run first
2. **"Class not found" errors**: Ensure subjects and programs are properly seeded
3. **Database connection errors**: Check that PostgreSQL is running and accessible

### Reset and Re-run

If you need to reset and re-seed everything:

```bash
# Reset database completely
pnpm db:reset

# Run basic seed
pnpm db:seed

# Run comprehensive seed
pnpm db:seed:comprehensive
```

## Performance Considerations

- The comprehensive seeding can take 2-5 minutes to complete
- It generates thousands of records across multiple tables
- Database performance may be affected during seeding
- Consider running during off-peak hours for production databases

## Customization

You can customize the seeding by modifying `seed-comprehensive-data.js`:

- **Student List**: Update the `STUDENTS` array
- **Record Counts**: Change `recordsPerClass` variable
- **Probabilities**: Adjust the random probability checks
- **Comments**: Update the comment arrays for each type
- **Terms**: Modify the `ACADEMIC_TERMS` array

## Data Privacy

This seeding creates fictional test data only. All student names, emails, and record details are generated for testing purposes and do not represent real individuals or events.
