# QAF Scheduling System

A comprehensive bilingual (English/Arabic) scheduling management system designed for the Qatar Armed Forces (QAF) Signal School and Information Technology.

## Overview

This is a single-page web application that manages educational schedules, courses, instructors, rooms, and groups. It features a modern UI with dark/light themes, bilingual support, and local data persistence.

## Features

### Core Functionality
- **Dashboard**: Real-time statistics and today's schedule overview
- **Calendar View**: Monthly calendar with schedule visualization
- **Weekly View**: Detailed weekly schedule grid (5 days × 7 periods)
- **Course Management**: Support for multiple courses (Officers, Diploma, Females)
- **Instructor Management**: Add, edit, and manage instructor profiles
- **Room Management**: Manage classroom and facility assignments
- **Group Management**: Organize student groups by course
- **Schedule Management**: Create and manage class schedules

### Additional Features
- **Bilingual Support**: Full English/Arabic language toggle (RTL/LTR)
- **Auto-Save**: Automatic data persistence to localStorage
- **Backup/Restore**: Export and import full data backups
- **Print Support**: Optimized print layouts for schedules
- **Password Protection**: Secure login system with changeable password
- **Course Switching**: Easy switching between different courses
- **Responsive Design**: Works on desktop and tablet devices

## Login Credentials

**Password Required Only** (No email/username needed)

- **Default Password**: `QAF2024`
- **Alternative Password** (from file): `Hamad@123`

**Note**: The system uses password-only authentication. Enter either password to access the system.

## Installation & Running

### Prerequisites
- Python 3.x installed
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Quick Start

1. Open terminal/command prompt in the project directory
2. Run the Python HTTP server on port 8000:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8000/Schedule_Management%20V3.html
   ```

### Alternative Methods

You can also open the HTML file directly in a browser by double-clicking `Schedule_Management V3.html`, but using a local server is recommended for full functionality.

## Application Structure

### Main Pages
- **Dashboard**: Overview with statistics and today's schedule
- **Calendar**: Monthly calendar view with schedule markers
- **Weekly**: Detailed weekly schedule grid
- **Courses**: Manage course information and settings
- **Instructors**: Add/edit instructor profiles
- **Rooms**: Manage classroom resources
- **Groups**: Organize student groups
- **Schedule**: Create and manage class schedules

### Course Types
- **Officers Course** (دورة الضباط)
- **Diploma Course** (الدورة الدبلوماسية)
- **Females Course** (دورة الإناث)

## Data Management

### Auto-Save
- All changes are automatically saved to browser localStorage
- Data persists between sessions
- "Auto-Save ON" indicator shows in sidebar

### Backup & Restore
- **Backup**: Click "💾 Backup" to download a JSON file of all data
- **Restore**: Click "📂 Restore" to upload a previously saved backup
- Backups include all courses, instructors, rooms, groups, and schedules

## Print Functionality

The system includes optimized print layouts:
- Weekly schedule grids (one-page per week)
- Monthly schedules
- Course-specific schedules
- QAF-branded headers and footers
- Arabic-optimized typography

## Technical Details

### Technologies Used
- Pure HTML5, CSS3, JavaScript (no frameworks)
- LocalStorage for data persistence
- Google Fonts (DM Serif Display, IBM Plex Sans Arabic, Outfit)
- Responsive CSS Grid/Flexbox layouts

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires JavaScript enabled

### File Structure
```
form faisal/
├── Schedule_Management V3.html    # Main application file
├── passwrod.txt                   # Password reference file
├── Schedule_QAF_SRS_1.docx        # Requirements document
└── README.md                     # This file
```

## Usage Guide

### First Login
1. Open the application in your browser
2. Enter the password: `QAF2024` or `Hamad@123`
3. Click "Login" or press Enter
4. Select a course to begin (Officers, Diploma, or Females)

### Creating a Schedule
1. Navigate to the "Schedule" page
2. Add instructors, rooms, and groups first (if not already added)
3. Use the weekly view to assign sessions
4. Changes auto-save automatically

### Switching Courses
- Use the course dropdown in the top bar
- Each course maintains separate schedules and data

### Changing Password
1. Click "Change Password" on the login screen
2. Enter current password
3. Enter new password (minimum 4 characters)
4. Confirm new password
5. Click "Save"

## Support

For issues or questions about the QAF Scheduling System, please refer to the requirements document (`Schedule_QAF_SRS_1.docx`) or contact the system administrator.

## Security Notes

- Password is stored in browser localStorage (hashed)
- For production use, implement server-side authentication
- Regular backups are recommended
- Clear browser data will reset all local data

## License

Internal use for Qatar Armed Forces - Signal School and Information Technology.
