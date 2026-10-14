package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.response.ClientLessonResponse;
import com.mycompany.saas_japanese.domain.response.StudentLessonSummaryResponse;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long>, JpaSpecificationExecutor<Lesson> {
  Optional<Lesson> findByIdAndIsDeletedFalse(Long id);

  Optional<Lesson> findByIdAndIsDeletedFalseAndCourseIsDeletedFalse(Long id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select lesson from Lesson lesson where lesson.id = :id "
      + "and lesson.isDeleted = false and lesson.course.isDeleted = false")
  Optional<Lesson> findActiveForUpdate(@Param("id") Long id);

  boolean existsByVideoMediaIdAndIsDeletedFalse(Long videoMediaId);

  long countByCourseIdAndIsDeletedFalse(Long courseId);

  List<Lesson> findAllByCourseIdAndIsDeletedFalse(Long courseId);
  long countByCourseCategoryIdAndCourseIsDeletedFalseAndIsDeletedFalse(Long categoryId);

  @Query("select l.course.id as parentId, count(l) as total from Lesson l "
      + "where l.isDeleted = false and l.course.id in :ids group by l.course.id")
  List<ParentCount> countByCourseIds(@Param("ids") List<Long> ids);

  @Query("select l.course.id as parentId, count(l) as total, "
      + "coalesce(sum(l.durationMinutes), 0L) as totalDurationMinutes from Lesson l "
      + "where l.isDeleted = false and l.isPublished = true and l.course.id in :ids group by l.course.id")
  List<PublicLessonStatistics> findPublicStatisticsByCourseIds(@Param("ids") List<Long> ids);

  // Lesson has no persisted sortOrder; ID provides a stable order without inventing syllabus structure.
  @Query("select new com.mycompany.saas_japanese.domain.response.ClientLessonResponse("
      + "l.id, l.title, l.slug, l.durationMinutes) from Lesson l "
      + "where l.course.id = :courseId and l.isDeleted = false and l.isPublished = true order by l.id asc")
  List<ClientLessonResponse> findPublicLessonsByCourseId(@Param("courseId") Long courseId);

  @Query("""
      select l from Lesson l join fetch l.course c left join fetch l.videoMedia
      where l.id = :id and l.isDeleted = false and l.deletedAt is null and l.isPublished = true
        and c.isDeleted = false and c.deletedAt is null and c.isPublished = true
      """)
  Optional<Lesson> findAvailableForStudy(@Param("id") Long id);

  // Project only syllabus/progress fields; never load grammar or video media for the list.
  @Query("""
      select new com.mycompany.saas_japanese.domain.response.StudentLessonSummaryResponse(
        l.id, c.id, l.title, l.slug, l.durationMinutes,
        coalesce(p.watchDuration, 0), coalesce(p.videoDuration, 0), coalesce(p.progressPercent, 0),
        coalesce(p.isCompleted, false), p.lastWatchedAt, p.completedAt)
      from Lesson l join l.course c
      left join LessonProgress p on p.lesson = l and p.user.id = :userId
      where c.id = :courseId and l.isDeleted = false and l.deletedAt is null and l.isPublished = true
        and c.isDeleted = false and c.deletedAt is null and c.isPublished = true
      order by l.id asc
      """)
  List<StudentLessonSummaryResponse> findStudyLessons(@Param("courseId") Long courseId, @Param("userId") Long userId);

  @Query("""
      select count(l) as totalLessons,
        count(case when p.isCompleted = true then 1 end) as completedLessons
      from Lesson l join l.course c
      left join LessonProgress p on p.lesson = l and p.user.id = :userId
      where c.id = :courseId and l.isDeleted = false and l.deletedAt is null and l.isPublished = true
        and c.isDeleted = false and c.deletedAt is null and c.isPublished = true
      """)
  StudyCourseStatistics summarizeStudyProgress(@Param("courseId") Long courseId, @Param("userId") Long userId);
}
