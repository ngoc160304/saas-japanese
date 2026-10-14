'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AuthUser } from '@/apis/auth/auth.type';
import {
  studentDashboardAPI,
  studentDashboardKeys,
} from '@/apis/student-dashboard/student-dashboard.api';
import { clientCoursesAPI, clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { selectAuthInitialized, selectCurrentUser, selectIsAuthenticated } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import type { CourseStatistic, DashboardProfile } from '../types';
import { DashboardHeader } from './DashboardHeader';
import { CourseStatistics } from './CourseStatistics';
import { LearningInsights } from './LearningInsights';
import { EnrolledCoursesTable } from './EnrolledCoursesTable';
import { DashboardSidePanel } from './DashboardSidePanel';
import styles from './student-dashboard.module.css';

function DashboardContent({ user }: { user: AuthUser }) {
  const [today] = useState(() => new Date());
  const [page, setPage] = useState(0);
  const params = { page, size: 6 };
  const summaryQuery = useQuery({
    queryKey: studentDashboardKeys.summary(user.id),
    queryFn: ({ signal }) => studentDashboardAPI.getSummary(signal),
    retry: false,
    refetchOnMount: 'always',
  });
  const coursesQuery = useQuery({
    queryKey: clientCoursesQueryKeys.myCoursesPage(user.id, params),
    queryFn: ({ signal }) => clientCoursesAPI.getMyCourses(params, signal),
    retry: false,
    refetchOnMount: 'always',
  });
  const summary = summaryQuery.isError ? undefined : summaryQuery.data;
  const statistics: CourseStatistic[] = [
    { label: 'Enrolled Courses', value: summary?.enrolledCourses ?? null, tone: 'sky' },
    { label: 'Courses In Progress', value: summary?.inProgressCourses ?? null, tone: 'amber' },
    { label: 'Completed Courses', value: summary?.completedCourses ?? null, tone: 'emerald' },
  ];
  const profile: DashboardProfile = {
    name: user.name,
    email: user.email,
    greeting:
      today.getHours() < 12
        ? 'Good Morning'
        : today.getHours() < 18
          ? 'Good Afternoon'
          : 'Good Evening',
    dateLabel: today.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    dateBadge: today.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' }),
    weekday: today.toLocaleDateString('vi-VN', { weekday: 'long' }),
  };
  return (
    <div className={`${styles.dashboard} flex min-w-0 flex-col gap-5 xl:flex-row xl:gap-14`}>
      <div className="min-w-0 flex-1">
        <DashboardHeader profile={profile} />
        {summaryQuery.isError && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center gap-3 text-sm text-rose-700"
          >
            <p>{getApiErrorMessage(summaryQuery.error)}</p>
            <Button
              variant="outline"
              disabled={summaryQuery.isFetching}
              onClick={() => void summaryQuery.refetch()}
            >
              Thử tải lại thống kê
            </Button>
          </div>
        )}
        <CourseStatistics statistics={statistics} loading={summaryQuery.isPending} />
        <LearningInsights />
        <EnrolledCoursesTable
          courses={coursesQuery.data?.content ?? []}
          loading={coursesQuery.isPending}
          error={coursesQuery.isError ? getApiErrorMessage(coursesQuery.error) : null}
          retrying={coursesQuery.isFetching}
          onRetry={() => void coursesQuery.refetch()}
          page={page}
          totalPages={coursesQuery.data?.totalPages ?? 0}
          onPageChange={setPage}
        />
      </div>
      <DashboardSidePanel profile={profile} today={today} />
    </div>
  );
}

export function StudentDashboard() {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  if (!initialized || !authenticated || !user)
    return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  return <DashboardContent key={user.id} user={user} />;
}
