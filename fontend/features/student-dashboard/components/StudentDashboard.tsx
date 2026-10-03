import profileFixture from '../mocks/profile.json';
import statisticsFixture from '../mocks/statistics.json';
import activityFixture from '../mocks/activity.json';
import focusFixture from '../mocks/focus.json';
import streakFixture from '../mocks/streak.json';
import coursesFixture from '../mocks/courses.json';
import calendarFixture from '../mocks/calendar.json';
import milestoneFixture from '../mocks/milestone.json';
import type {
  CourseStatistic,
  DashboardProfile,
  LearningActivity,
  FocusCardData,
  StreakData,
  EnrolledCourse,
  StudyCalendar,
  MilestoneData,
} from '../types';
import { DashboardHeader } from './DashboardHeader';
import { CourseStatistics } from './CourseStatistics';
import { LearningInsights } from './LearningInsights';
import { EnrolledCoursesTable } from './EnrolledCoursesTable';
import { DashboardSidePanel } from './DashboardSidePanel';
import styles from './student-dashboard.module.css';

const profile: DashboardProfile = profileFixture;
const statistics: CourseStatistic[] = statisticsFixture;
const activity: LearningActivity = activityFixture;
const focus: FocusCardData = focusFixture;
const streak: StreakData = streakFixture;
const courses: EnrolledCourse[] = coursesFixture;
const calendar: StudyCalendar = calendarFixture;
const milestone: MilestoneData = milestoneFixture;

export function StudentDashboard() {
  return (
    <div className={`${styles.dashboard} flex min-w-0 flex-col gap-5 xl:flex-row xl:gap-14`}>
      <div className="min-w-0 flex-1">
        <DashboardHeader profile={profile} />
        <CourseStatistics statistics={statistics} />
        <LearningInsights activity={activity} focus={focus} streak={streak} />
        <EnrolledCoursesTable courses={courses} />
      </div>
      <DashboardSidePanel
        profile={profile}
        streak={streak}
        calendar={calendar}
        milestone={milestone}
      />
    </div>
  );
}
