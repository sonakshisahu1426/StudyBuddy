# StudyBuddy — Personal Study Workspace & Productivity Web Application

> **A minimal, distraction-free study planner and Pomodoro focus environment built with React, TypeScript, Tailwind CSS, and local IndexedDB (Dexie.js).**

StudyBuddy is a personal study workspace designed with an editorial aesthetic inspired by fine notebooks, reading applications, and focused productivity tools. It avoids generic AI-dashboard tropes (no decorative blobs, floating glassmorphism, or fake stats) in favor of warm typography, restrained palettes, clear hierarchy, and robust offline capability.

---

## 🌟 Key Capabilities

### 1. Home Dashboard
* **Dynamic Time-of-Day Greeting:** Warm, unobtrusive welcome with the current local date.
* **Deterministic Daily Thought:** Thoughtful reflection from a curated collection of learning and focus quotations; selected deterministically by date or persisted when refreshed. Option to view another reflection.
* **Today's Study Schedule:** Filtered tasks scheduled for today with direct status toggling, duration estimates, activity tags (`Study`, `Practice`, `Revise`), and one-click Focus Room launch.
* **Upcoming Deadlines & Work:** Immediate visibility into exams, assignment deadlines, and pending study blocks over the coming 7 days.
* **Overdue Task Warnings:** Alerts the student if prior tasks were missed without silently rescheduling or losing user records.
* **Progress Summary:** Real-time metrics computed directly from local records.
* **Quick Actions:** Instant triggers for creating tasks, subjects, starting focus sessions, and reviewing revision queues.

### 2. Syllabus & Subject Management (Subject › Chapter › Topic)
* **Full Syllabus Tree:** Unrestricted depth of Subjects, Chapters/Modules, and Topics.
* **Subject Customization:** Curated editorial color palettes, descriptions, and progress bars.
* **Topic Metadata:**
  * Status: `Not Started`, `In Progress`, `Completed`.
  * Difficulty Rating: `Easy`, `Medium`, `Hard`.
  * Independent Revision Flag: Flag topics for revision with optional target dates and overdue badges. Marking a topic complete does not clear its revision need.
  * Personal Notes: Formulas, textbook references, and lecture slides notes.
  * Estimated Study Duration: Time allocation in minutes.
* **Topic Detail Drawer:** Inspect topic metrics, past study session history, and quick-start actions for `Study`, `Practice`, or `Revise`.
* **Referential Integrity & Cascading Policies:** Deleting a subject or chapter provides an explicit confirmation dialog detailing consequences, unlinks planner tasks, and takes a snapshot of subject/topic names in past study sessions so history is never destroyed.

### 3. Study Planner (Monthly & Weekly Synchronized)
* **Monthly Calendar View:** Standard grid with proper weekday alignment, today highlights, subject color dots, task completion checks, and date inspector.
* **Weekly Focus Planner:** Monday-to-Sunday columns (configurable) displaying planned tasks, completion checkboxes, carry-forward actions, and planned vs. actual focus time comparison.
* **Date Integrity:** Stored in local `YYYY-MM-DD` representation to prevent UTC timezone drift.
* **Shared Source of Truth:** Monthly and weekly views read from the same Dexie live query.

### 4. Customizable Pomodoro Focus Room
* **Timestamp-Accurate Countdown:** Built on target timestamps (`Date.now() + remainingMs`) to remain accurate across tab switching, computer sleep, and window minimizing.
* **Arbitrary Interval Sequences:** Configurable sequences (e.g. 25m Focus → 5m Break → 25m Focus → 15m Long Break). Supports `Study`, `Short Break`, `Long Break`, and `Custom` intervals.
* **Break & Pause Separation:** Only active `study` intervals contribute to accumulated focused time. Break and paused durations are strictly excluded.
* **Reload & Crash Restoration:** Persistent `ActiveTimerState` restores paused or running countdowns seamlessly upon page reload.
* **Sound Alerts:** Browser-synthesized dual-tone chimes using the Web Audio API without external audio network dependencies.
* **Topic & Task Association:** Link any session to an existing subject, chapter, topic, and task.
* **Session Summary & History:** Summarizes focused study time upon completion with an optional reflection note input. Past sessions can be inspected and deleted.

### 5. Progress Analytics
* **Zero Fake Statistics:** Every card, chart, and progress bar is calculated strictly from actual IndexedDB records.
* **All-Time & Period Focus:** Total focus time, focus time today, focus time this week, and focus time this month.
* **Syllabus Coverage:** Total subjects, chapters, topics, completed topics, in-progress topics, and overall completion percentages.
* **Activity Breakdown:** Visual distribution across `Study` (new concepts), `Practice` (problem sets), and `Revise` (spaced retrieval).
* **Focus Time by Subject:** Breakdown of which courses receive the most attention.
* **Revision Health:** Tracks topics marked for revision, overdue revision dates, and completed revision tasks.

### 6. Settings & Data Management
* **Visual Themes:** Three persistent modes: `Light` (warm paper), `Dark` (deep charcoal), and `System` (matches OS color scheme).
* **Timer Preferences:** Default preset selection, automatic vs. manual interval advancement, and sound toggle.
* **Calendar Customization:** Choice of first day of the week (Monday or Sunday) and default task duration.
* **Data Portability & Backups:**
  * **Export Backup:** One-click download of all user data as human-readable JSON with schema version and timestamp.
  * **Validated Restore:** Validates schema structure, arrays, and IDs before applying backup, presenting an inspection preview with confirmation dialog.
  * **Load Sample Academic Data:** Convenient one-click option to populate the app with sample courses (Computer Systems, Linear Algebra, Cognitive Philosophy) for demo and testing.
  * **Factory Reset:** Cleanly wipe local database and restore defaults with confirmation.
* **Global Search (`Cmd+K` / `Ctrl+K`):** Fast modal search across subjects, topics, notes, and tasks.

---

## 🗄️ IndexedDB Schema (Dexie.js)

The application uses a dedicated Dexie database (`StudyBuddyDB` v1) with reactive subscriptions via `useLiveQuery`:

| Table | Primary Key | Key Indexes | Description |
|---|---|---|---|
| `subjects` | `id` | `name`, `createdAt` | Academic subjects / courses |
| `chapters` | `id` | `subjectId`, `order`, `createdAt` | Units / modules belonging to a subject |
| `topics` | `id` | `chapterId`, `subjectId`, `status`, `difficulty`, `needsRevision`, `revisionDate`, `order` | Discrete concepts with difficulty & revision flags |
| `studyTasks` | `id` | `date`, `subjectId`, `chapterId`, `topicId`, `completed`, `activityType`, `category` | Scheduled study and deadline items |
| `timerPresets` | `id` | `name`, `isDefault`, `createdAt` | Custom Pomodoro routines & interval sequences |
| `studySessions` | `id` | `subjectId`, `topicId`, `taskId`, `activityType`, `startTime`, `endTime`, `createdAt` | Focused study logs (breaks & pauses excluded) |
| `activeTimerState` | `id` | `id` (`current`) | State preservation for reload restoration |
| `appSettings` | `id` | `id` (`app_settings`) | Theme, sound, firstDayOfWeek, autoAdvance preferences |
| `dailyThoughtSelections`| `date` | `date`, `thoughtId` | Selected daily thought ID per calendar day |

---

## 🚀 Running the Project Locally

### Prerequisites
* **Node.js** (v18+ or v20+)
* **npm** (v9+)

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Quality Assurance Tests
```bash
npm test
```
Executes the automated domain logic test suite (date handling, timer accuracy, thought determinism, backup schema validation, referential integrity).

### Production Build
```bash
npm run build
```
Type checks the entire codebase with strict TypeScript (`tsc`) and builds the static bundle (`vite build`) in `dist/`.

---

## 🛡️ Privacy & Offline Architecture
* **100% Client-Side:** No cloud database, no tracking, no external backend, no accounts.
* **No AI Dependencies:** No AI APIs, no decorative chatbots, no generated hallucinations.
* **Offline-Ready:** Works completely offline without internet connectivity once loaded.
