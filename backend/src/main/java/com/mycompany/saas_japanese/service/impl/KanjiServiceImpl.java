package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.repository.KanjiRepository;
import com.mycompany.saas_japanese.service.KanjiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class KanjiServiceImpl implements KanjiService {

    @Autowired
    private KanjiRepository kanjiRepository;

    @Override
    public List<Kanji> getAll() {
        return kanjiRepository.findByDeletedAtIsNull();
    }

    @Override
    public List<Kanji> getByLesson(Long lessonId) {
        return kanjiRepository.findByLessonIdAndDeletedAtIsNull(lessonId);
    }

    @Override
    public Kanji getById(Long id) {
        return kanjiRepository.findById(id).filter(k -> k.getDeletedAt() == null).orElse(null);
    }

    @Override
    public Kanji create(Kanji kanji) {
        return kanjiRepository.save(kanji);
    }

    @Override
    public Kanji update(Long id, Kanji details) {
        Kanji kanji = getById(id);
        if (kanji != null) {
            kanji.setLessonId(details.getLessonId());
            kanji.setKanji(details.getKanji());
            kanji.setOnyomi(details.getOnyomi());
            kanji.setKunyomi(details.getKunyomi());
            kanji.setMeaningVi(details.getMeaningVi());
            kanji.setStrokeCount(details.getStrokeCount());
            kanji.setExampleWords(details.getExampleWords());
            kanji.setUpdatedAt(LocalDateTime.now());
            return kanjiRepository.save(kanji);
        }
        return null;
    }

    @Override
    public void delete(Long id) {
        Kanji kanji = getById(id);
        if (kanji != null) {
            kanji.setDeletedAt(LocalDateTime.now());
            kanjiRepository.save(kanji);
        }
    }
}