# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: welcome-schedule-font.spec.js >> Welcome schedule font scaling >> slider scales table cells, legend, and outside-hours chip
- Location: tests/e2e/specs/welcome-schedule-font.spec.js:33:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 14
Received:   14
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic:
        - button "Menu":
          - img
        - generic:
          - button "Collapse navbar":
            - img
        - generic:
          - generic:
            - img "QAF"
          - button "Cyber Diploma Fall 2027 Wed, Jul 8, 2026":
            - generic:
              - generic: Cyber Diploma
              - generic: Fall 2027
              - generic: Wed, Jul 8, 2026
            - generic:
              - img
        - generic:
          - generic:
            - generic:
              - button "Welcome":
                - img
            - generic:
              - button "Switch to Arabic":
                - img
            - generic:
              - button "My Access":
                - img
            - generic:
              - button "Start Guided Tour":
                - img
            - generic:
              - button "Information":
                - img
            - generic:
              - button:
                - img
          - generic:
            - generic:
              - generic: D
            - generic:
              - generic:
                - generic:
                  - img
    - generic [ref=e5]:
      - generic "Resize" [ref=e6]
      - generic [ref=e8]:
        - generic [ref=e10]:
          - generic [ref=e11]: D
          - generic "Instructor" [ref=e12]:
            - img [ref=e13]
        - generic [ref=e16]:
          - button "Switch to Dark" [ref=e17] [cursor=pointer]:
            - img [ref=e18]
          - button "Collapse" [ref=e20] [cursor=pointer]:
            - img [ref=e21]
          - button "enable auto hide" [ref=e23] [cursor=pointer]:
            - img [ref=e24]
          - button "disable sticky" [ref=e27] [cursor=pointer]:
            - img [ref=e28]
          - button [ref=e30] [cursor=pointer]:
            - img [ref=e31]
      - navigation [ref=e34]:
        - button "Main" [ref=e36] [cursor=pointer]:
          - generic [ref=e37]: Main
          - img [ref=e38]
        - button "Scheduling And Availabilities" [ref=e41] [cursor=pointer]:
          - generic [ref=e42]: Scheduling And Availabilities
          - img [ref=e43]
        - button "Availability" [ref=e46] [cursor=pointer]:
          - generic [ref=e47]: Availability
          - img [ref=e48]
        - button "Drive" [ref=e51] [cursor=pointer]:
          - generic [ref=e52]: Drive
          - img [ref=e53]
        - button "Community" [ref=e56] [cursor=pointer]:
          - generic [ref=e57]: Community
          - img [ref=e58]
        - button "Settings" [ref=e61] [cursor=pointer]:
          - generic [ref=e62]: Settings
          - img [ref=e63]
      - generic [ref=e65]:
        - generic [ref=e66]:
          - generic: v1.0.0 - 08 Jul 2026
        - generic [ref=e67]:
          - button "العربية" [ref=e68] [cursor=pointer]:
            - generic [ref=e69]: العربية
          - button "Logout" [ref=e70] [cursor=pointer]:
            - generic [ref=e71]: Logout
    - main [ref=e72]:
      - generic [ref=e75]:
        - tablist [ref=e79]:
          - tab "Schedule" [selected] [ref=e80] [cursor=pointer]
          - tab "Overview" [ref=e81] [cursor=pointer]
          - tab "Operations" [ref=e82] [cursor=pointer]
        - generic [ref=e84]:
          - generic [ref=e86]:
            - table [ref=e89]:
              - rowgroup [ref=e99]:
                - row "Day 1st Lecture Break 2nd Lecture Break 3rd Lecture Office Hours" [ref=e100]:
                  - columnheader "Day" [ref=e101]:
                    - generic [ref=e103]: Day
                  - columnheader [ref=e104]
                  - columnheader "1st Lecture" [ref=e105]:
                    - generic [ref=e106]: 1st Lecture
                  - columnheader "Break" [ref=e107]:
                    - generic [ref=e109]: Break
                  - columnheader "2nd Lecture" [ref=e110]:
                    - generic [ref=e111]: 2nd Lecture
                  - columnheader "Break" [ref=e112]:
                    - generic [ref=e114]: Break
                  - columnheader "3rd Lecture" [ref=e115]:
                    - generic [ref=e116]: 3rd Lecture
                  - columnheader "Office Hours" [ref=e117]:
                    - generic [ref=e119]:
                      - text: Office
                      - text: Hours
              - rowgroup [ref=e120]:
                - row "Sunday Subject Introduction to Cybersecurity 08:00 – 08:30 Network Security 09:30 – 10:00 Not taken yet Cryptography & Data Protection 11:00 – 12:00" [ref=e121]:
                  - cell "Sunday" [ref=e122]:
                    - generic [ref=e124]: Sunday
                  - cell "Subject" [ref=e125]:
                    - generic [ref=e126]: Subject
                  - cell "Introduction to Cybersecurity" [ref=e127] [cursor=pointer]:
                    - button "Introduction to Cybersecurity" [ref=e128]:
                      - generic [ref=e129]:
                        - generic "Not taken yet" [ref=e130]
                        - img [ref=e133]
                        - generic [ref=e136]: Introduction to Cybersecurity
                  - cell "08:00 – 08:30" [ref=e137]:
                    - generic [ref=e140]:
                      - text: 08:00
                      - text: –
                      - text: 08:30
                  - cell "Network Security" [ref=e141] [cursor=pointer]:
                    - button "Network Security" [ref=e142]:
                      - generic [ref=e143]:
                        - generic "Not taken yet" [ref=e144]
                        - img [ref=e147]
                        - generic [ref=e150]: Network Security
                  - cell "09:30 – 10:00" [ref=e151]:
                    - generic [ref=e154]:
                      - text: 09:30
                      - text: –
                      - text: 10:00
                  - cell "Not taken yet Cryptography & Data Protection" [ref=e155]:
                    - generic [ref=e156]:
                      - generic "Not taken yet" [ref=e157]
                      - generic [ref=e158]: Cryptography & Data Protection
                  - cell "11:00 – 12:00" [ref=e159]:
                    - generic [ref=e162]:
                      - text: 11:00
                      - text: –
                      - text: 12:00
                - row "Time 07:00 – 08:00 08:30 – 09:30 10:00 – 11:00" [ref=e163]:
                  - cell "Time" [ref=e164]:
                    - generic [ref=e165]: Time
                  - cell "07:00 – 08:00" [ref=e166]:
                    - generic [ref=e168]: 07:00 – 08:00
                  - cell "08:30 – 09:30" [ref=e169]:
                    - generic [ref=e171]: 08:30 – 09:30
                  - cell "10:00 – 11:00" [ref=e172]:
                    - generic [ref=e174]: 10:00 – 11:00
                - row "Instructor Dr. Sami Al-Qahtani Dr. Sami Al-Qahtani Dr. Layla Al-Dosari" [ref=e175]:
                  - cell "Instructor" [ref=e176]:
                    - generic [ref=e177]: Instructor
                  - cell "Dr. Sami Al-Qahtani" [ref=e178]:
                    - generic [ref=e180]: Dr. Sami Al-Qahtani
                  - cell "Dr. Sami Al-Qahtani" [ref=e181]:
                    - generic [ref=e183]: Dr. Sami Al-Qahtani
                  - cell "Dr. Layla Al-Dosari" [ref=e184]:
                    - generic [ref=e186]: Dr. Layla Al-Dosari
                - row "Room b room en b room en b room en" [ref=e187]:
                  - cell "Room" [ref=e188]:
                    - generic [ref=e189]: Room
                  - cell "b room en" [ref=e190]:
                    - generic [ref=e192]: b room en
                  - cell "b room en" [ref=e193]:
                    - generic [ref=e195]: b room en
                  - cell "b room en" [ref=e196]:
                    - generic [ref=e198]: b room en
              - rowgroup [ref=e199]:
                - row "Monday Subject Not taken yet Ethical Hacking 08:00 – 08:30 Not taken yet Digital Forensics 09:30 – 10:00 — 11:00 – 12:00" [ref=e200]:
                  - cell "Monday" [ref=e201]:
                    - generic [ref=e203]: Monday
                  - cell "Subject" [ref=e204]:
                    - generic [ref=e205]: Subject
                  - cell "Not taken yet Ethical Hacking" [ref=e206]:
                    - generic [ref=e207]:
                      - generic "Not taken yet" [ref=e208]
                      - generic [ref=e209]: Ethical Hacking
                  - cell "08:00 – 08:30" [ref=e210]:
                    - generic [ref=e213]:
                      - text: 08:00
                      - text: –
                      - text: 08:30
                  - cell "Not taken yet Digital Forensics" [ref=e214]:
                    - generic [ref=e215]:
                      - generic "Not taken yet" [ref=e216]
                      - generic [ref=e217]: Digital Forensics
                  - cell "09:30 – 10:00" [ref=e218]:
                    - generic [ref=e221]:
                      - text: 09:30
                      - text: –
                      - text: 10:00
                  - cell "—" [ref=e222]:
                    - generic [ref=e223]: —
                  - cell "11:00 – 12:00" [ref=e224]:
                    - generic [ref=e227]:
                      - text: 11:00
                      - text: –
                      - text: 12:00
                - row "Time 07:00 – 08:30 09:00 – 10:30 —" [ref=e228]:
                  - cell "Time" [ref=e229]:
                    - generic [ref=e230]: Time
                  - cell "07:00 – 08:30" [ref=e231]:
                    - generic [ref=e233]: 07:00 – 08:30
                  - cell "09:00 – 10:30" [ref=e234]:
                    - generic [ref=e236]: 09:00 – 10:30
                  - cell "—" [ref=e237]:
                    - generic [ref=e238]: —
                - row "Instructor Prof. Tariq Al-Shammari Dr. Hana Al-Ghamdi" [ref=e239]:
                  - cell "Instructor" [ref=e240]:
                    - generic [ref=e241]: Instructor
                  - cell "Prof. Tariq Al-Shammari" [ref=e242]:
                    - generic [ref=e244]: Prof. Tariq Al-Shammari
                  - cell "Dr. Hana Al-Ghamdi" [ref=e245]:
                    - generic [ref=e247]: Dr. Hana Al-Ghamdi
                  - cell [ref=e248]
                - row "Room b room en b room en —" [ref=e250]:
                  - cell "Room" [ref=e251]:
                    - generic [ref=e252]: Room
                  - cell "b room en" [ref=e253]:
                    - generic [ref=e255]: b room en
                  - cell "b room en" [ref=e256]:
                    - generic [ref=e258]: b room en
                  - cell "—" [ref=e259]:
                    - generic [ref=e260]: —
              - rowgroup [ref=e261]:
                - row "Tuesday Subject Not taken yet Ethical Hacking 08:00 – 08:30 Not taken yet Digital Forensics 09:30 – 10:00 Introduction to Cybersecurity 11:00 – 12:00" [ref=e262]:
                  - cell "Tuesday" [ref=e263]:
                    - generic [ref=e265]: Tuesday
                  - cell "Subject" [ref=e266]:
                    - generic [ref=e267]: Subject
                  - cell "Not taken yet Ethical Hacking" [ref=e268]:
                    - generic [ref=e269]:
                      - generic "Not taken yet" [ref=e270]
                      - generic [ref=e271]: Ethical Hacking
                  - cell "08:00 – 08:30" [ref=e272]:
                    - generic [ref=e275]:
                      - text: 08:00
                      - text: –
                      - text: 08:30
                  - cell "Not taken yet Digital Forensics" [ref=e276]:
                    - generic [ref=e277]:
                      - generic "Not taken yet" [ref=e278]
                      - generic [ref=e279]: Digital Forensics
                  - cell "09:30 – 10:00" [ref=e280]:
                    - generic [ref=e283]:
                      - text: 09:30
                      - text: –
                      - text: 10:00
                  - cell "Introduction to Cybersecurity" [ref=e284] [cursor=pointer]:
                    - button "Introduction to Cybersecurity" [ref=e285]:
                      - generic [ref=e286]:
                        - generic "Not taken yet" [ref=e287]
                        - img [ref=e290]
                        - generic [ref=e293]: Introduction to Cybersecurity
                  - cell "11:00 – 12:00" [ref=e294]:
                    - generic [ref=e297]:
                      - text: 11:00
                      - text: –
                      - text: 12:00
                - row "Time 07:00 – 08:00 08:30 – 09:30 10:00 – 11:00" [ref=e298]:
                  - cell "Time" [ref=e299]:
                    - generic [ref=e300]: Time
                  - cell "07:00 – 08:00" [ref=e301]:
                    - generic [ref=e303]: 07:00 – 08:00
                  - cell "08:30 – 09:30" [ref=e304]:
                    - generic [ref=e306]: 08:30 – 09:30
                  - cell "10:00 – 11:00" [ref=e307]:
                    - generic [ref=e309]: 10:00 – 11:00
                - row "Instructor Prof. Tariq Al-Shammari Dr. Hana Al-Ghamdi Dr. Sami Al-Qahtani" [ref=e310]:
                  - cell "Instructor" [ref=e311]:
                    - generic [ref=e312]: Instructor
                  - cell "Prof. Tariq Al-Shammari" [ref=e313]:
                    - generic [ref=e315]: Prof. Tariq Al-Shammari
                  - cell "Dr. Hana Al-Ghamdi" [ref=e316]:
                    - generic [ref=e318]: Dr. Hana Al-Ghamdi
                  - cell "Dr. Sami Al-Qahtani" [ref=e319]:
                    - generic [ref=e321]: Dr. Sami Al-Qahtani
                - row "Room b room en b room en b room en" [ref=e322]:
                  - cell "Room" [ref=e323]:
                    - generic [ref=e324]: Room
                  - cell "b room en" [ref=e325]:
                    - generic [ref=e327]: b room en
                  - cell "b room en" [ref=e328]:
                    - generic [ref=e330]: b room en
                  - cell "b room en" [ref=e331]:
                    - generic [ref=e333]: b room en
              - rowgroup [ref=e334]:
                - row "Wednesday Subject Network Security 08:00 – 08:30 Not taken yet Cryptography & Data Protection 09:30 – 10:00 — 11:00 – 12:00" [ref=e335]:
                  - cell "Wednesday" [ref=e336]:
                    - generic [ref=e338]: Wednesday
                  - cell "Subject" [ref=e339]:
                    - generic [ref=e340]: Subject
                  - cell "Network Security" [ref=e341] [cursor=pointer]:
                    - button "Network Security" [ref=e342]:
                      - generic [ref=e343]:
                        - generic "Not taken yet" [ref=e344]
                        - img [ref=e347]
                        - generic [ref=e350]: Network Security
                  - cell "08:00 – 08:30" [ref=e351]:
                    - generic [ref=e354]:
                      - text: 08:00
                      - text: –
                      - text: 08:30
                  - cell "Not taken yet Cryptography & Data Protection" [ref=e355]:
                    - generic [ref=e356]:
                      - generic "Not taken yet" [ref=e357]
                      - generic [ref=e358]: Cryptography & Data Protection
                  - cell "09:30 – 10:00" [ref=e359]:
                    - generic [ref=e362]:
                      - text: 09:30
                      - text: –
                      - text: 10:00
                  - cell "—" [ref=e363]:
                    - generic [ref=e364]: —
                  - cell "11:00 – 12:00" [ref=e365]:
                    - generic [ref=e368]:
                      - text: 11:00
                      - text: –
                      - text: 12:00
                - row "Time 07:00 – 08:30 09:00 – 10:30 —" [ref=e369]:
                  - cell "Time" [ref=e370]:
                    - generic [ref=e371]: Time
                  - cell "07:00 – 08:30" [ref=e372]:
                    - generic [ref=e374]: 07:00 – 08:30
                  - cell "09:00 – 10:30" [ref=e375]:
                    - generic [ref=e377]: 09:00 – 10:30
                  - cell "—" [ref=e378]:
                    - generic [ref=e379]: —
                - row "Instructor Dr. Sami Al-Qahtani Dr. Layla Al-Dosari" [ref=e380]:
                  - cell "Instructor" [ref=e381]:
                    - generic [ref=e382]: Instructor
                  - cell "Dr. Sami Al-Qahtani" [ref=e383]:
                    - generic [ref=e385]: Dr. Sami Al-Qahtani
                  - cell "Dr. Layla Al-Dosari" [ref=e386]:
                    - generic [ref=e388]: Dr. Layla Al-Dosari
                  - cell [ref=e389]
                - row "Room b room en b room en —" [ref=e391]:
                  - cell "Room" [ref=e392]:
                    - generic [ref=e393]: Room
                  - cell "b room en" [ref=e394]:
                    - generic [ref=e396]: b room en
                  - cell "b room en" [ref=e397]:
                    - generic [ref=e399]: b room en
                  - cell "—" [ref=e400]:
                    - generic [ref=e401]: —
              - rowgroup [ref=e402]:
                - row "Thursday Subject Not taken yet Cryptography & Data Protection 08:00 – 08:30 Not taken yet Ethical Hacking 09:30 – 10:00 Not taken yet Digital Forensics 11:00 – 12:00" [ref=e403]:
                  - cell "Thursday" [ref=e404]:
                    - generic [ref=e406]: Thursday
                  - cell "Subject" [ref=e407]:
                    - generic [ref=e408]: Subject
                  - cell "Not taken yet Cryptography & Data Protection" [ref=e409]:
                    - generic [ref=e410]:
                      - generic "Not taken yet" [ref=e411]
                      - generic [ref=e412]: Cryptography & Data Protection
                  - cell "08:00 – 08:30" [ref=e413]:
                    - generic [ref=e416]:
                      - text: 08:00
                      - text: –
                      - text: 08:30
                  - cell "Not taken yet Ethical Hacking" [ref=e417]:
                    - generic [ref=e418]:
                      - generic "Not taken yet" [ref=e419]
                      - generic [ref=e420]: Ethical Hacking
                  - cell "09:30 – 10:00" [ref=e421]:
                    - generic [ref=e424]:
                      - text: 09:30
                      - text: –
                      - text: 10:00
                  - cell "Not taken yet Digital Forensics" [ref=e425]:
                    - generic [ref=e426]:
                      - generic "Not taken yet" [ref=e427]
                      - generic [ref=e428]: Digital Forensics
                  - cell "11:00 – 12:00" [ref=e429]:
                    - generic [ref=e432]:
                      - text: 11:00
                      - text: –
                      - text: 12:00
                - row "Time 07:00 – 08:00 08:30 – 09:30 10:00 – 11:00" [ref=e433]:
                  - cell "Time" [ref=e434]:
                    - generic [ref=e435]: Time
                  - cell "07:00 – 08:00" [ref=e436]:
                    - generic [ref=e438]: 07:00 – 08:00
                  - cell "08:30 – 09:30" [ref=e439]:
                    - generic [ref=e441]: 08:30 – 09:30
                  - cell "10:00 – 11:00" [ref=e442]:
                    - generic [ref=e444]: 10:00 – 11:00
                - row "Instructor Dr. Layla Al-Dosari Prof. Tariq Al-Shammari Dr. Hana Al-Ghamdi" [ref=e445]:
                  - cell "Instructor" [ref=e446]:
                    - generic [ref=e447]: Instructor
                  - cell "Dr. Layla Al-Dosari" [ref=e448]:
                    - generic [ref=e450]: Dr. Layla Al-Dosari
                  - cell "Prof. Tariq Al-Shammari" [ref=e451]:
                    - generic [ref=e453]: Prof. Tariq Al-Shammari
                  - cell "Dr. Hana Al-Ghamdi" [ref=e454]:
                    - generic [ref=e456]: Dr. Hana Al-Ghamdi
                - row "Room b room en b room en b room en" [ref=e457]:
                  - cell "Room" [ref=e458]:
                    - generic [ref=e459]: Room
                  - cell "b room en" [ref=e460]:
                    - generic [ref=e462]: b room en
                  - cell "b room en" [ref=e463]:
                    - generic [ref=e465]: b room en
                  - cell "b room en" [ref=e466]:
                    - generic [ref=e468]: b room en
            - generic [ref=e469]:
              - generic [ref=e472]: Not taken yet
              - generic [ref=e475]: Draft
              - generic [ref=e478]: Attendance taken
              - generic [ref=e481]: Submitted
              - generic [ref=e484]: Current time
              - generic [ref=e487]: Lecture in progress
              - generic [ref=e490]: Selected class
              - generic [ref=e492]: Outside working hours
              - generic [ref=e493]:
                - slider "schedule font size" [ref=e498]: "14"
                - generic [ref=e499]: 14px
              - button "Expand" [ref=e500] [cursor=pointer]:
                - img [ref=e501]
          - paragraph [ref=e506]: Blue pulsing cells are your classes — click (not hover) for actions
  - generic [ref=e508]:
    - alertdialog "Click here any time to change the program or term." [ref=e509]:
      - generic [ref=e511]: Click here any time to change the program or term.
      - generic [ref=e512]:
        - button "Skip" [ref=e514] [cursor=pointer]
        - button "Next (Step 1 of 2)" [ref=e515] [cursor=pointer]
      - button "Close" [ref=e516] [cursor=pointer]:
        - img [ref=e517]
    - generic:
      - generic:
        - img
```

# Test source

```ts
  1  | /**
  2  |  * Welcome page schedule font scaling
  3  |  */
  4  | import { test, expect } from '@playwright/test';
  5  | import { gotoWithAuth, dismissOverlays } from '../utils/ui-helpers.js';
  6  | 
  7  | async function readScheduleFontMetrics(page) {
  8  |   return page.evaluate(() => {
  9  |     const grid = document.querySelector('[data-testid="official-weekly-schedule-grid"]');
  10 |     const table = grid?.querySelector('table');
  11 |     const subjectBtn = grid?.querySelector('[data-testid^="schedule-cell-"]');
  12 |     const subjectText = subjectBtn?.querySelector('span');
  13 |     const rowLabel = grid?.querySelector('tbody tr td:nth-child(2) div');
  14 |     const lectureHeader = grid?.querySelector('thead th:nth-child(3) span');
  15 |     const outsideChip = grid?.querySelector('.MuiChip-root');
  16 |     const legend = grid?.querySelector('[class*="statusLegend"]');
  17 | 
  18 |     const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : null);
  19 | 
  20 |     return {
  21 |       cssVar: parseFloat(getComputedStyle(grid).getPropertyValue('--schedule-font-size')),
  22 |       table: px(table),
  23 |       subject: px(subjectText),
  24 |       rowLabel: px(rowLabel),
  25 |       lectureHeader: px(lectureHeader),
  26 |       outsideChip: px(outsideChip),
  27 |       legend: px(legend),
  28 |     };
  29 |   });
  30 | }
  31 | 
  32 | test.describe('Welcome schedule font scaling', () => {
  33 |   test('slider scales table cells, legend, and outside-hours chip', async ({ page }) => {
  34 |     await gotoWithAuth(page, '/welcome?tab=schedule', 'instructor');
  35 | 
  36 |     await expect(page.getByTestId('official-weekly-schedule-grid')).toBeVisible({ timeout: 30000 });
  37 |     await dismissOverlays(page);
  38 |     await page.getByRole('button', { name: /close|skip/i }).click().catch(() => {});
  39 |     await expect(page.getByTestId('schedule-font-slider')).toBeVisible({ timeout: 15000 });
  40 | 
  41 |     const before = await readScheduleFontMetrics(page);
  42 |     expect(before.table).toBeGreaterThan(0);
  43 |     expect(before.subject).toBeGreaterThan(0);
  44 |     expect(before.subject).toBeCloseTo(before.table, 0);
  45 | 
  46 |     const slider = page.getByTestId('schedule-font-slider');
  47 |     await slider.focus();
  48 |     // Move slider toward max in several steps
  49 |     for (let i = 0; i < 8; i += 1) {
  50 |       await page.keyboard.press('ArrowRight');
  51 |     }
  52 |     await page.waitForTimeout(300);
  53 | 
  54 |     const after = await readScheduleFontMetrics(page);
> 55 |     expect(after.table).toBeGreaterThan(before.table);
     |                         ^ Error: expect(received).toBeGreaterThan(expected)
  56 |     expect(after.subject).toBeGreaterThan(before.subject);
  57 |     expect(after.subject).toBeCloseTo(after.table, 0);
  58 |     expect(after.lectureHeader).toBeCloseTo(after.table, 0);
  59 |     expect(after.rowLabel).toBeCloseTo(after.table, 0);
  60 | 
  61 |     if (after.outsideChip) {
  62 |       expect(after.outsideChip).toBeGreaterThan(before.outsideChip || 0);
  63 |     }
  64 | 
  65 |     await expect(page.getByTestId('schedule-font-size-label')).not.toHaveText(`${before.cssVar}px`);
  66 |   });
  67 | });
  68 | 
```