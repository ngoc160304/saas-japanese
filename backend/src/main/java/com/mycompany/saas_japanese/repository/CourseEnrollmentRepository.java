package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.CourseEnrollment;
import com.mycompany.saas_japanese.domain.response.StudentDashboardResponse;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

@Repository 
public interface CourseEnrollmentRepository
        extends JpaRepository<CourseEnrollment, Long>, JpaSpecificationExecutor<CourseEnrollment> {

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    Optional<CourseEnrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    // An existing parent row also serializes first progress inserts, before a child row exists.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from CourseEnrollment e where e.user.id = :userId and e.course.id = :courseId")
    Optional<CourseEnrollment> findForStudyUpdate(@Param("userId") Long userId, @Param("courseId") Long courseId);

    List<CourseEnrollment> findByUserId(Long userId);

    @Query("""
        select new com.mycompany.saas_japanese.domain.response.StudentDashboardResponse(
          count(e),
          count(case when e.completedAt is null and e.progressPercent = 0 then 1 end),
          count(case when e.completedAt is null and e.progressPercent > 0
              and e.progressPercent < 100 then 1 end),
          count(case when e.completedAt is not null or e.progressPercent >= 100 then 1 end))
        from CourseEnrollment e
        where e.user.id = :userId and e.course.isDeleted = false
        """)
    StudentDashboardResponse summarizeForUser(@Param("userId") Long userId);
}
