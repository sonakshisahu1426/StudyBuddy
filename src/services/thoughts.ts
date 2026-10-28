import { DailyThought } from '../types';

export const CURATED_THOUGHTS: DailyThought[] = [
  {
    id: 'thought-1',
    text: 'Deep work is the ability to focus without distraction on a cognitively demanding task.',
    author: 'Cal Newport'
  },
  {
    id: 'thought-2',
    text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.',
    author: 'Mahatma Gandhi'
  },
  {
    id: 'thought-3',
    text: 'The beautiful thing about learning is that no one can take it away from you.',
    author: 'B.B. King'
  },
  {
    id: 'thought-4',
    text: 'Small daily improvements over time lead to stunning results.',
    author: 'Robin Sharma'
  },
  {
    id: 'thought-5',
    text: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier'
  },
  {
    id: 'thought-6',
    text: 'Understanding a concept deeply is far more valuable than simply memorizing answers.',
    author: 'StudyBuddy Reflection'
  },
  {
    id: 'thought-7',
    text: 'Patience and persistence have a magical effect before which difficulties disappear and obstacles vanish.',
    author: 'John Quincy Adams'
  },
  {
    id: 'thought-8',
    text: 'Quality is not an act, it is a habit. What we repeatedly do becomes who we are.',
    author: 'Will Durant'
  },
  {
    id: 'thought-9',
    text: 'Clarity of mind follows deliberate, distraction-free study intervals.',
    author: 'StudyBuddy Reflection'
  },
  {
    id: 'thought-10',
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin'
  },
  {
    id: 'thought-11',
    text: 'The expert in anything was once a beginner who refused to quit.',
    author: 'Helen Hayes'
  },
  {
    id: 'thought-12',
    text: 'Revise with intention: true memory is built through regular, spaced retrieval.',
    author: 'StudyBuddy Reflection'
  },
  {
    id: 'thought-13',
    text: 'Order and simplification are the first steps toward the mastery of a subject.',
    author: 'Thomas Mann'
  },
  {
    id: 'thought-14',
    text: 'Focus is a muscle. Each session where you resist temptation strengthens it.',
    author: 'StudyBuddy Reflection'
  },
  {
    id: 'thought-15',
    text: 'It is not that I am so smart, it is just that I stay with problems longer.',
    author: 'Albert Einstein'
  }
];

export function getDeterministicThoughtForDate(dateStr: string): DailyThought {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURATED_THOUGHTS.length;
  return CURATED_THOUGHTS[index];
}

export function getRandomAlternativeThought(currentId: string): DailyThought {
  const alternatives = CURATED_THOUGHTS.filter(t => t.id !== currentId);
  if (alternatives.length === 0) return CURATED_THOUGHTS[0];
  const randIndex = Math.floor(Math.random() * alternatives.length);
  return alternatives[randIndex];
}
