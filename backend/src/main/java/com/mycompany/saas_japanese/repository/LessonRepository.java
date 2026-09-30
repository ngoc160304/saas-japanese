package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.response.ClientLessonResponse;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long>, JpaSpecificationExecutor<Lesson> {
  Optional<Lesson> findByIdAndIsDeletedFalse(Long id);

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
}
