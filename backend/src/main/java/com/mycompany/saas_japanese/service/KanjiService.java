package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.Kanji;
import java.util.List;

public interface KanjiService {
    List<Kanji> getAll();

    List<Kanji> getByLesson(Long lessonId);

    Kanji getById(Long id);

    Kanji create(Kanji kanji);

    Kanji update(Long id, Kanji kanjiDetails);

    void delete(Long id);
}