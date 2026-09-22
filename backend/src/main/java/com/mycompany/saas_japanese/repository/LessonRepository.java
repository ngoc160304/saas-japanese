package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Lesson;

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
}
