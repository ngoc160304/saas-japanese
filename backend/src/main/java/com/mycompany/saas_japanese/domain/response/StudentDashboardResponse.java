package com.mycompany.saas_japanese.domain.response;

public record StudentDashboardResponse(
    long enrolledCourses, long notStartedCourses, long inProgressCourses, long completedCourses) {
}

