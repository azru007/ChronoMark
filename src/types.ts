export type EventCategory = 
  | 'deep_work' 
  | 'planning' 
  | 'meeting' 
  | 'review' 
  | 'debugging' 
  | 'break' 
  | 'learning' 
  | 'personal';

export interface TimelineEvent {
  id: string;
  timestamp: number; // Unix epoch ms
  isoDate: string;   // YYYY-MM-DD
  timeString: string; // HH:mm:ss or 12h display
  note?: string;      // Quick note at the event moment
  category?: EventCategory;
  tags?: string[];
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TimelineSpan {
  id: string;
  startIndex: number;
  startTime: number;
  endTime: number;
  durationMs: number;
  startEventId: string;
  endEventId?: string;
  isOngoing?: boolean;
  annotation: string; // User notes between event markers
  category: EventCategory;
}

export interface DayStats {
  date: string;
  eventCount: number;
  totalLoggedMinutes: number;
  categoryMinutes: Record<string, number>;
  longestSpanMinutes: number;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isAnonymous: boolean;
}

export interface AppSettings {
  soundEnabled: boolean;
  soundTheme: 'tactile-click' | 'zen-bell' | 'marimba' | 'cyber-drop';
  hapticEnabled: boolean;
  darkMode: boolean;
  timeFormat24h: boolean;
  confettiOnMilestone: boolean;
  vibrationIntensity: 'subtle' | 'medium' | 'strong';
}
