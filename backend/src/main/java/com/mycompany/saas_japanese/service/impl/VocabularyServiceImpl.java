package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.repository.VocabularyRepository;
import com.mycompany.saas_japanese.service.VocabularyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class VocabularyServiceImpl implements VocabularyService {

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Override
    public List<Vocabulary> getAll() {
        return vocabularyRepository.findByDeletedAtIsNull();
    }

    @Override
    public List<Vocabulary> getByLesson(Long lessonId) {
        return vocabularyRepository.findByLessonIdAndDeletedAtIsNull(lessonId);
    }

    @Override
    public Vocabulary getById(Long id) {
        return vocabularyRepository.findById(id).filter(v -> v.getDeletedAt() == null).orElse(null);
    }

    @Override
    public Vocabulary create(Vocabulary vocabulary) {
        return vocabularyRepository.save(vocabulary);
    }

    @Override
    public Vocabulary update(Long id, Vocabulary details) {
        Vocabulary vocab = getById(id);
        if (vocab != null) {
            vocab.setLessonId(details.getLessonId());
            vocab.setWord(details.getWord());
            vocab.setReading(details.getReading());
            vocab.setMeaningVi(details.getMeaningVi());
            vocab.setExampleSentenceJp(details.getExampleSentenceJp());
            vocab.setExampleSentenceVi(details.getExampleSentenceVi());
            vocab.setPartOfSpeech(details.getPartOfSpeech());
            vocab.setUpdatedAt(LocalDateTime.now());
            return vocabularyRepository.save(vocab);
        }
        return null;
    }

    @Override
    public void delete(Long id) {
        Vocabulary vocab = getById(id);
        if (vocab != null) {
            vocab.setDeletedAt(LocalDateTime.now());
            vocabularyRepository.save(vocab);
        }
    }
}