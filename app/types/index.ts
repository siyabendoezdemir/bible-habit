export interface ReadingStreak {
  currentStreak: number;
  lastReadDate: string | null;
  totalDaysRead: number;
}

export interface BibleReading {
  id: string;
  date: string;
  book: string;
  chapter: number;
  completed: boolean;
  notes?: string;
}

export interface ReadingGoal {
  chaptersPerDay: number;
  reminderTime: string; // 24-hour format HH:mm
  enabled: boolean;
} 