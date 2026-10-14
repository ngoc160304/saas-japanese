import type { AuthUser } from '@/apis/auth/auth.type';

export interface DashboardProfile extends Pick<AuthUser, 'name' | 'email'> {
  greeting: string;
  dateLabel: string;
  dateBadge: string;
  weekday: string;
}

export interface CourseStatistic {
  label: string;
  value: number | null;
  tone: 'sky' | 'amber' | 'emerald';
}
