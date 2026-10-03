export interface DashboardProfile {
  name: string;
  email: string;
  level: string;
  target: string;
  rank: string;
  avatar: string;
  greeting: string;
  dateLabel: string;
  dateBadge: string;
  weekday: string;
}

export interface CourseStatistic {
  label: string;
  value: number;
  tone: string;
}

export interface ActivityBar {
  day: number;
  percent: number;
  completed: boolean;
}

export interface LearningActivity {
  totalMinutes: number;
  scaleMaximum: number;
  bars: ActivityBar[];
  metrics: { label: string; value: string; unit: string; positive?: boolean }[];
}

export interface FocusCardData {
  learnerAvatars: string[];
  sessionsCompleted: number;
  sessionsTarget: number;
  description: string;
}

export interface StreakData {
  longestTotal: number;
  gaugeValue: number;
  gaugeMaximum: number;
  currentDays: number;
  bestDays: number;
}

export interface EnrolledCourse {
  id: string;
  level: string;
  title: string;
  slug: string;
  enrolledDate: string;
  progress: number;
  learnerAvatars: string[];
  additionalLearners: number;
  tone: string;
}

export interface CalendarDay {
  date: string;
  day: number;
  outsideMonth?: boolean;
  studied?: boolean;
  selected?: boolean;
}

export interface StudyCalendar {
  monthLabel: string;
  studiedDays: number;
  streakDays: number;
  days: CalendarDay[];
}

export interface MilestoneData {
  title: string;
  earnedCount: number;
  progressPercent: number;
  daysRemaining: number;
  image: string;
}
