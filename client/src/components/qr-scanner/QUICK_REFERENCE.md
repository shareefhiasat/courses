# QR Scanner Page - Quick Reference

## 🚀 How to Access

Navigate to: `/instructor/qr-scanner`

Or add to your routes:
```jsx
import InstructorQRScannerPage from './pages/InstructorQRScannerPage';

<Route path="/instructor/qr-scanner" element={<InstructorQRScannerPage />} />
```

---

## 📋 Quick Start (3 Steps)

### 1. Select Class
Use the top dropdowns:
- **Program** → **Subject** → **Class** → **Date**

### 2. Scan Students
- Click the camera area in the sidebar
- Point at student QR code
- Student auto-marked present

### 3. Track Behavior
- Student panel opens automatically
- Select behavior/participation
- Edit points if needed
- Add notes → Apply

---

## 🎯 Key Features at a Glance

| Feature | Location | Action |
|---------|----------|--------|
| **Select Class** | Top dropdowns | Choose Program → Subject → Class |
| **Choose Date** | Top right | Click date picker |
| **Scan QR Code** | Left sidebar | Click scanner, point at QR |
| **Search Student** | Roster header | Type name or ID |
| **Sort Students** | Column headers | Click to sort |
| **Pin Student** | Student row | Click star icon |
| **View History** | Student row | Click chevron (›) to expand |
| **Open Actions** | Student row | Click sidebar icon or row |
| **Add Participation** | Action panel | Select type, edit points, apply |
| **Add Behavior** | Action panel | Select type, edit points, apply |
| **Add Penalty** | Action panel | Select type, edit points, apply |
| **Change Page** | Bottom | Previous/Next buttons |

---

## 📊 Data Display

### Student Roster Columns:
1. **Expand** (›) - Show history
2. **Student Name** (⭐ pin icon + avatar)
3. **Attendance** (Present/Late/Absent badges)
4. **Part.** (Participation points, color-coded)
5. **Behav.** (Behavior points, color-coded)
6. **Penalty** (Penalty points, red if negative)
7. **Action** (Sidebar icon to open panel)

### Color Coding:
- 🟢 **Green** = Present, High points (≥10)
- 🔵 **Blue** = Medium points (5-9)
- 🟡 **Yellow** = Late
- 🔴 **Red** = Absent, Negative points, Penalties
- ⚪ **Gray** = Low points (0-4)

---

## 🎬 Common Workflows

### Mark Attendance via QR Code:
```
1. Select class and date
2. Click scanner → Camera activates
3. Scan student QR code
4. Student auto-marked "Present"
5. Panel opens for additional actions
```

### Add Participation Points:
```
1. Open student (scan or click row)
2. Click "Participation" tab
3. Select participation type
   (e.g., "Answered Question" = 2 points)
4. Edit points if needed (e.g., change to 3)
5. Add note (optional)
6. Click "Apply"
```

### Record Behavior Issue:
```
1. Open student
2. Click "Behavior" tab
3. Select behavior type
   (e.g., "Talk in Class" = -2 points)
4. Add note explaining situation
5. Click "Apply"
```

### Add Penalty:
```
1. Open student
2. Click "Penalty" tab
3. Select penalty type
   (e.g., "Mobile Phone" = -2 points)
4. Edit points if needed
5. Add note
6. Click "Apply"
```

### View Student History:
```
1. Find student in roster
2. Click chevron icon (›) on left
3. Row expands showing today's history:
   - Participation entries (green)
   - Behavior entries (green/red)
   - Penalty entries (red)
4. Each entry shows time, points, and reason
```

### Search & Filter:
```
1. Type in search box (header)
2. Results filter in real-time
3. Click column headers to sort
4. Use pagination to navigate pages
```

### Pin Important Students:
```
1. Click star icon next to student name
2. Star turns gold = pinned
3. Click again to unpin
```

---

## 🎨 Action Panel Tabs

### Participation Tab:
**Purpose:** Reward positive contributions

**Options:**
- Explained Lesson (5 pts)
- Gave Project (10 pts)
- Gave Paper (8 pts)
- Gave Research (12 pts)
- Active Discussion (3 pts)
- Answered Question (2 pts)
- Helped Classmate (4 pts)
- Excellent Participation (10 pts)
- Good Participation (5 pts)
- Average Participation (2 pts)

### Behavior Tab:
**Purpose:** Track positive/negative behaviors

**Negative:**
- Talk in Class (-2 pts)
- Sleep (-3 pts)
- Bathroom Requests (-1 pt)
- Mobile in Class (-2 pts)
- Disruptive (-3 pts)
- Late Arrival (-1 pt)
- Inappropriate Language (-4 pts)

**Positive:**
- Positive Behavior (+3 pts)
- Helpful to Others (+2 pts)
- Good Participation (+1 pt)

### Penalty Tab:
**Purpose:** Record formal penalties

Shows same negative behaviors as Behavior tab, but saves to penalties collection for official records.

---

## 💡 Pro Tips

### Camera Scanning:
- ✅ Good lighting improves scan speed
- ✅ Hold phone steady
- ✅ QR code should fill 60% of frame
- ✅ Works on mobile and desktop
- ✅ Switch between front/back camera if needed

### Points Management:
- Default points shown but fully editable
- Can select multiple behaviors at once
- Points auto-calculate: Participation + Behavior + Penalty
- History shows today's activities only
- Totals show all-time cumulative points

### Efficient Workflow:
1. Keep scanner active during class
2. Scan students as they arrive
3. Quick mark participation/behavior
4. Use search for quick student lookup
5. Pin frequently accessed students

### Mobile vs Desktop:
- **Mobile**: Use back camera for scanning student QR codes
- **Desktop**: Use webcam, students scan their codes to you
- Both modes auto-detected

---

## 🔧 Troubleshooting

### Camera Won't Activate:
- ✅ Check browser permissions
- ✅ Use HTTPS (required for camera API)
- ✅ Try different browser
- ✅ Ensure camera not used by another app

### QR Code Won't Scan:
- ✅ Improve lighting
- ✅ Move closer/farther
- ✅ Clean camera lens
- ✅ Ensure QR code is clear/not damaged

### Students Not Loading:
- ✅ Check class is selected
- ✅ Verify enrollments exist
- ✅ Check Firebase connection
- ✅ Refresh page

### Points Not Saving:
- ✅ Check internet connection
- ✅ Verify Firebase permissions
- ✅ Check browser console for errors
- ✅ Try again after page refresh

---

## 📱 Mobile Optimization

### Best Practices for Mobile:
1. Hold phone in portrait mode
2. Use back camera for best results
3. Ensure stable connection
4. Tap student rows for quick actions
5. Swipe on history for details

### Touch Targets:
- All buttons ≥ 44px for easy tapping
- Large tap areas on student rows
- Easy-to-access controls

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between fields |
| `Enter` | Apply changes (when in panel) |
| `Esc` | Close action panel |
| `Ctrl+F` | Focus search box |
| Arrow keys | Navigate table |

---

## 📈 Data & Analytics

### What Gets Tracked:
- ✅ Daily attendance status
- ✅ Participation points (cumulative)
- ✅ Behavior points (cumulative)
- ✅ Penalty points (cumulative)
- ✅ Timestamp for each action
- ✅ Notes/reasons for each action

### How Totals Calculate:
```
Total Points = Participation + Behavior + Penalty

Example:
  Participation: +12
  Behavior: +5
  Penalty: -2
  ─────────────
  Total: 15 points
```

---

## 🔒 Permissions & Security

### Required Permissions:
- Camera access (for QR scanning)
- Firebase read/write (for data)
- Instructor role (for page access)

### Data Privacy:
- Student data encrypted in transit
- Firebase security rules applied
- Only authorized instructors can access
- Notes marked as internal (not visible to students)

---

## 📞 Support

### Common Questions:

**Q: Can I edit past entries?**
A: Currently shows history, editing coming soon.

**Q: Can students see their behavior notes?**
A: No, internal notes are for instructors only.

**Q: How far back does history go?**
A: Currently shows today's history in roster, all-time in totals.

**Q: Can I bulk-mark attendance?**
A: Currently one-by-one, bulk features planned.

**Q: Does it work offline?**
A: No, requires internet for Firebase sync.

---

## 🎓 Best Practices

### For Instructors:
1. **Start of Class**:
   - Select correct class and date
   - Activate scanner
   - Scan students as they arrive

2. **During Class**:
   - Quick-mark participation as it happens
   - Use notes to record context
   - Pin active students for quick access

3. **End of Class**:
   - Review attendance
   - Verify all entries saved
   - Check expanded history for accuracy

4. **Daily Workflow**:
   - Same class? Just change date
   - Different class? Select from dropdowns
   - Regular scanning = accurate records

---

## 🎯 Success Metrics

Track your usage:
- Scans per session
- Average response time
- Student engagement (participation points)
- Behavior trends over time

---

**Need more help?** See `README.md` for detailed documentation or `IMPLEMENTATION_SUMMARY.md` for technical details.
