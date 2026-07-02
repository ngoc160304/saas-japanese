package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Grammar;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GrammarRepository extends JpaRepository<Grammar, Long> {
    List<Grammar> findByDeletedAtIsNull();

    List<Grammar> findByLessonIdAndDeletedAtIsNull(Long lessonId);
}