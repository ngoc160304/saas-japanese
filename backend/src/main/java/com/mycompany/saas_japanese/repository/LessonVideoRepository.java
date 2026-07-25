package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.LessonVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonVideoRepository extends JpaRepository<LessonVideo, Long> {
    List<LessonVideo> findByLessonIdOrderBySortOrderAsc(Long lessonId);
    void deleteByLessonId(Long lessonId);
}
