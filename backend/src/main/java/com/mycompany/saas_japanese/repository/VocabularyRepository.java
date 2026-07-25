package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {
    List<Vocabulary> findByLessonIdOrderBySortOrderAsc(Long lessonId);
}