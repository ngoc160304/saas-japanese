
package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Kanji;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KanjiRepository extends JpaRepository<Kanji, Long> {
    List<Kanji> findByDeletedAtIsNull();

    List<Kanji> findByLessonIdAndDeletedAtIsNull(Long lessonId);
}