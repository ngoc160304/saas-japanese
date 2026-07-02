package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.Vocabulary;
import java.util.List;

public interface VocabularyService {
    List<Vocabulary> getAll();

    List<Vocabulary> getByLesson(Long lessonId);

    Vocabulary getById(Long id);

    Vocabulary create(Vocabulary vocabulary);

    Vocabulary update(Long id, Vocabulary vocabDetails);

    void delete(Long id);
}