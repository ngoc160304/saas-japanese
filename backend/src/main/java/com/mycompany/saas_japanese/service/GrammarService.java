package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.Grammar;
import java.util.List;

public interface GrammarService {
    List<Grammar> getAll();

    List<Grammar> getByLesson(Long lessonId);

    Grammar getById(Long id);

    Grammar create(Grammar grammar);

    Grammar update(Long id, Grammar grammarDetails);

    void delete(Long id);
}