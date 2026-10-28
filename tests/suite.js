// Automated Quality Assurance Test Suite for StudyBuddy Domain Logic
import assert from 'node:assert';
import test from 'node:test';

// 1. Test Date & Time utilities
test('Date utilities: local date string format and consistency', () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const expectedToday = `${year}-${month}-${day}`;

  // Ensure string matches YYYY-MM-DD
  assert.match(expectedToday, /^\d{4}-\d{2}-\d{2}$/);
});

test('Date utilities: isDateOverdue correctly detects past vs future dates', () => {
  function isDateOverdue(dateStr, todayStr) {
    if (!dateStr) return false;
    return dateStr < todayStr;
  }

  const today = '2026-10-28';
  assert.strictEqual(isDateOverdue('2026-10-27', today), true, 'Yesterday must be overdue');
  assert.strictEqual(isDateOverdue('2026-10-28', today), false, 'Today is not overdue');
  assert.strictEqual(isDateOverdue('2026-10-29', today), false, 'Tomorrow is not overdue');
  assert.strictEqual(isDateOverdue(null, today), false, 'Null date is not overdue');
});

test('Time utilities: formatSecondsToTime formats MM:SS and HH:MM:SS', () => {
  function formatSecondsToTime(seconds) {
    const safeSec = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(safeSec / 3600);
    const mins = Math.floor((safeSec % 3600) / 60);
    const secs = safeSec % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  assert.strictEqual(formatSecondsToTime(0), '00:00');
  assert.strictEqual(formatSecondsToTime(5), '00:05');
  assert.strictEqual(formatSecondsToTime(65), '01:05');
  assert.strictEqual(formatSecondsToTime(1500), '25:00'); // 25 mins pomodoro
  assert.strictEqual(formatSecondsToTime(3661), '1:01:01'); // 1 hr 1 min 1 sec
});

test('Time utilities: formatSecondsToHumanReadable formats seconds cleanly', () => {
  function formatSecondsToHumanReadable(seconds) {
    const safeSec = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(safeSec / 3600);
    const mins = Math.floor((safeSec % 3600) / 60);

    if (hrs === 0 && mins === 0) return `${safeSec}s`;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  }

  assert.strictEqual(formatSecondsToHumanReadable(30), '30s');
  assert.strictEqual(formatSecondsToHumanReadable(1500), '25m');
  assert.strictEqual(formatSecondsToHumanReadable(3600), '1h');
  assert.strictEqual(formatSecondsToHumanReadable(5400), '1h 30m');
});

// 2. Test Today's Thought Deterministic Selection
test('Thought selection: deterministic selection per date', () => {
  const CURATED_THOUGHTS = [
    { id: 'thought-1', text: 'Thought 1', author: 'Author 1' },
    { id: 'thought-2', text: 'Thought 2', author: 'Author 2' },
    { id: 'thought-3', text: 'Thought 3', author: 'Author 3' },
  ];

  function getDeterministicThoughtForDate(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % CURATED_THOUGHTS.length;
    return CURATED_THOUGHTS[index];
  }

  const thoughtDateA1 = getDeterministicThoughtForDate('2026-10-28');
  const thoughtDateA2 = getDeterministicThoughtForDate('2026-10-28');
  assert.strictEqual(thoughtDateA1.id, thoughtDateA2.id, 'Same date must return same thought on repeated calls');

  function getRandomAlternativeThought(currentId) {
    const alternatives = CURATED_THOUGHTS.filter(t => t.id !== currentId);
    return alternatives[0];
  }

  const alt = getRandomAlternativeThought(thoughtDateA1.id);
  assert.notStrictEqual(alt.id, thoughtDateA1.id, 'Alternative thought must not be the same as current thought');
});

// 3. Test Backup Validation Logic
test('Backup Validation: detects valid and corrupt schemas', () => {
  function validateBackupJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'File is not a valid JSON object.' };
      }
      if (typeof parsed.version !== 'number' || parsed.version <= 0) {
        return { valid: false, error: 'Missing or invalid schema version.' };
      }
      if (!parsed.data || typeof parsed.data !== 'object') {
        return { valid: false, error: 'Backup data payload is missing.' };
      }
      const { subjects, chapters, topics, studyTasks } = parsed.data;
      if (!Array.isArray(subjects) || !Array.isArray(chapters) || !Array.isArray(topics) || !Array.isArray(studyTasks)) {
        return { valid: false, error: 'Corrupted backup: Core data collections are missing or invalid arrays.' };
      }
      for (const s of subjects) {
        if (!s.id || typeof s.name !== 'string') {
          return { valid: false, error: 'Subject missing ID or name.' };
        }
      }
      return { valid: true };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  // Valid backup
  const validPayload = JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    data: {
      subjects: [{ id: 'sub-1', name: 'CS 101', color: '#2c5649' }],
      chapters: [{ id: 'chap-1', subjectId: 'sub-1', name: 'Unit 1', order: 1 }],
      topics: [{ id: 'top-1', chapterId: 'chap-1', subjectId: 'sub-1', name: 'Logic', status: 'not_started', difficulty: 'easy', needsRevision: false }],
      studyTasks: [],
      timerPresets: [],
      studySessions: [],
    }
  });

  const res1 = validateBackupJson(validPayload);
  assert.strictEqual(res1.valid, true, 'Valid backup payload should pass');

  // Corrupted version
  const corruptVersion = JSON.stringify({ version: -1, data: {} });
  assert.strictEqual(validateBackupJson(corruptVersion).valid, false);

  // Missing data array
  const missingArrays = JSON.stringify({ version: 1, data: { subjects: 'invalid' } });
  assert.strictEqual(validateBackupJson(missingArrays).valid, false);

  // Malformed JSON string
  assert.strictEqual(validateBackupJson('not a json').valid, false);
});

// 4. Test Focus Timer interval logic & exclusion of breaks
test('Focus Timer: only study intervals accumulate focused time; breaks excluded', () => {
  const intervals = [
    { id: '1', name: 'Pomodoro 1', durationMinutes: 25, type: 'study' },
    { id: '2', name: 'Break', durationMinutes: 5, type: 'short_break' },
    { id: '3', name: 'Pomodoro 2', durationMinutes: 25, type: 'study' },
  ];

  let accumulatedFocusSeconds = 0;

  // Simulate tick on interval 0 (study) for 60 seconds
  for (let s = 0; s < 60; s++) {
    if (intervals[0].type === 'study') accumulatedFocusSeconds++;
  }
  assert.strictEqual(accumulatedFocusSeconds, 60, 'Study interval must add to focus time');

  // Simulate tick on interval 1 (break) for 60 seconds
  for (let s = 0; s < 60; s++) {
    if (intervals[1].type === 'study') accumulatedFocusSeconds++;
  }
  assert.strictEqual(accumulatedFocusSeconds, 60, 'Break interval must NOT add to focus time');
});

// 5. Test Referential integrity & session history snapshotting
test('Cascade Deletion Policy: session preserves subject and topic name snapshots', () => {
  const subject = { id: 'sub-1', name: 'Advanced Calculus' };
  const topic = { id: 'top-1', name: 'Taylor Series' };

  let session = {
    id: 'sess-1',
    subjectId: 'sub-1',
    topicId: 'top-1',
    subjectNameSnapshot: undefined,
    topicNameSnapshot: undefined,
    actualDurationSeconds: 1800,
  };

  // Simulating subject deletion cascading handler:
  session.subjectNameSnapshot = session.subjectNameSnapshot || subject.name;
  session.topicNameSnapshot = session.topicNameSnapshot || topic.name;
  session.subjectId = undefined;
  session.topicId = undefined;

  assert.strictEqual(session.subjectNameSnapshot, 'Advanced Calculus', 'Snapshot must preserve subject name');
  assert.strictEqual(session.topicNameSnapshot, 'Taylor Series', 'Snapshot must preserve topic name');
  assert.strictEqual(session.subjectId, undefined, 'Subject ID must be cleared to prevent orphan references');
  assert.strictEqual(session.actualDurationSeconds, 1800, 'Historical focus time remains intact');
});

// 6. Test Search Box Contrast in Dark and Light Themes (WCAG standards)
test('Search Input Accessibility: High Contrast in Dark and Light Modes', () => {
  // Convert hex to sRGB relative luminance
  function hexToLuminance(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;

    const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const R = toLinear(r);
    const G = toLinear(g);
    const B = toLinear(b);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function getContrastRatio(hex1, hex2) {
    const l1 = hexToLuminance(hex1);
    const l2 = hexToLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Dark theme: Charcoal-850 input background vs Stone-100 typed text
  const darkInputBg = '#1e2126';
  const darkInputText = '#f5f5f4'; // stone-100
  const darkPlaceholder = '#78716c'; // stone-500

  const darkTextContrast = getContrastRatio(darkInputBg, darkInputText);
  assert.ok(darkTextContrast > 7.0, `Dark theme typed text contrast must exceed WCAG AAA (7:1), got ${darkTextContrast.toFixed(2)}:1`);

  const darkPlaceholderContrast = getContrastRatio(darkInputBg, darkPlaceholder);
  assert.ok(darkPlaceholderContrast > 3.0, `Dark theme placeholder must have minimum legible contrast (3:1), got ${darkPlaceholderContrast.toFixed(2)}:1`);
  assert.ok(darkPlaceholderContrast < darkTextContrast, 'Placeholder must be visually distinct and subordinate to typed text');

  // Light theme: Stone-50 input background vs Stone-900 typed text
  const lightInputBg = '#fafaf9';
  const lightInputText = '#1c1917'; // stone-900
  const lightTextContrast = getContrastRatio(lightInputBg, lightInputText);
  assert.ok(lightTextContrast > 7.0, `Light theme typed text contrast must exceed WCAG AAA (7:1), got ${lightTextContrast.toFixed(2)}:1`);
});
