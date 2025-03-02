export interface BibleReading {
  id: string;
  book: string;
  chapter: number;
  date: string;
  completed: boolean;
  notes: string | undefined;
}

export interface ReadingStreak {
  currentStreak: number;
  lastReadDate: string | null;
  totalDaysRead: number;
} 