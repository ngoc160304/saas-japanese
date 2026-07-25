package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByDeletedAtIsNull();

    List<Lesson> findByCourseIdAndDeletedAtIsNull(Long courseId);

    List<Lesson> findByCourseIdAndPublishedTrueAndStatus(Long courseId, String status);
}