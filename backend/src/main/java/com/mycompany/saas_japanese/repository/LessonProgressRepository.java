package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.LessonProgress;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);

    List<LessonProgress> findByUserIdAndLessonCourseId(Long userId, Long courseId);

    long countByUserIdAndLessonCourseIdAndIsCompletedTrue(Long userId, Long courseId);
}