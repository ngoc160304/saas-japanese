package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Lesson;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long>, JpaSpecificationExecutor<Lesson> {
  Optional<Lesson> findByIdAndIsDeletedFalse(Long id);

  long countByCourseIdAndIsDeletedFalse(Long courseId);

  List<Lesson> findAllByCourseIdAndIsDeletedFalse(Long courseId);
}
