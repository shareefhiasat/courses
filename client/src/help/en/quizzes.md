---
title: Quizzes
tags: [quiz, assessment, question, grade, test]
route: /quizzes
order: 10
keywords: [quiz, test, assessment, questions, grades, auto-grading, question bank, time limit, passing score, due date, randomization, preview]
---

# Quizzes

The Quizzes screen lets instructors create, manage, and preview quizzes. Students can view available quizzes and start an attempt.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full quiz management |
| Admin | view, create, update, delete | Full quiz management |
| Instructor | view, create, update, delete | Create and manage quizzes for their classes |
| Student | view | View available quizzes and take them |

> **Screen ID:** `quizzes` — Requires at least `view` operation. Create/edit/delete require corresponding permissions.

## Key actions

### For instructors

- **Create quiz** — Opens the quiz builder to add questions, set time limits, and assign the quiz to a program or subject.
- **Preview** — See exactly how the quiz will appear to a student before publishing.
- **Edit** — Change quiz settings, questions, or scoring after creation. Already-submitted attempts are not affected.
- **Publish/Unpublish** — Control when a quiz becomes visible to students.
- **Results** — Review student scores and question-level statistics. See [Dashboard](/en/dashboard) results tabs for detailed analytics.

### For students

1. Navigate to the Quizzes screen from the side menu.
2. Click on an available quiz to start.
3. Answer each question within the time limit.
4. Submit when finished. You will see your score immediately if auto-grading is enabled.

## Validations & business rules

- **Time limit** — If a time limit is set, the quiz auto-submits when time expires.
- **Passing score** — Must be set before publishing. Students who score below the passing score see a "did not pass" message.
- **Question Bank** — Questions can be reused across multiple quizzes via the Question Bank.
- **Randomization** — When enabled, each student receives questions in a different order.
- **Single attempt** — By default, students get one attempt. Instructors can allow multiple attempts.
- **Auto-grading** — Multiple-choice and true/false questions are auto-graded. Essay questions require manual grading.
- **Due date** — If set, students cannot start the quiz after the due date.

## Prerequisites

- For instructors: you must have a class or subject assigned in the [Dashboard](/en/dashboard) before creating a quiz.
- For students: the quiz must be published and within the due date window.
- The quiz must be assigned to a program or subject that you are enrolled in.

## Limitations

- Students cannot pause a quiz once started — the timer continues running.
- Instructors cannot edit questions after a student has submitted an attempt (to preserve integrity).
- Quiz results feed into the [Dashboard](/en/dashboard) marks entry and analytics tabs.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Quiz not visible to students | Ensure the quiz is published and assigned to the correct program/subject. Check the due date. |
| Student cannot start the quiz | Verify the student is enrolled in the assigned program. Check if the due date has passed. |
| Auto-grading not working | Only multiple-choice and true/false questions are auto-graded. Essay questions require manual grading. |
| Timer not counting down | Ensure JavaScript is enabled and the browser is not in power-saving mode. Try a hard refresh. |
| Results not showing in Dashboard | Results sync periodically. Wait a few minutes or refresh the Marks Entry tab. |

## Related articles

- [Dashboard](/en/dashboard) — View quiz results in the Marks Entry and Analytics tabs.
- [Attendance](/en/attendance) — Attendance data can affect quiz eligibility.
- [Notifications](/en/notifications) — Students receive notifications when quiz results are published.
- [Profile & Settings](/en/profile) — Manage notification preferences for quiz events.
