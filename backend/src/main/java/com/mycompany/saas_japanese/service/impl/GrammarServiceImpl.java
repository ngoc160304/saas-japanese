package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.domain.Grammar;
import com.mycompany.saas_japanese.repository.GrammarRepository;
import com.mycompany.saas_japanese.service.GrammarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class GrammarServiceImpl implements GrammarService {

    @Autowired
    private GrammarRepository grammarRepository;

    @Override
    public List<Grammar> getAll() {
        return grammarRepository.findByDeletedAtIsNull();
    }

    @Override
    public List<Grammar> getByLesson(Long lessonId) {
        return grammarRepository.findByLessonIdAndDeletedAtIsNull(lessonId);
    }

    @Override
    public Grammar getById(Long id) {
        return grammarRepository.findById(id).filter(g -> g.getDeletedAt() == null).orElse(null);
    }

    @Override
    public Grammar create(Grammar grammar) {
        return grammarRepository.save(grammar);
    }

    @Override
    public Grammar update(Long id, Grammar details) {
        Grammar grammar = getById(id);
        if (grammar != null) {
            grammar.setLessonId(details.getLessonId());
            grammar.setTitle(details.getTitle());
            grammar.setContent(details.getContent());
            grammar.setUpdatedAt(LocalDateTime.now());
            return grammarRepository.save(grammar);
        }
        return null;
    }

    @Override
    public void delete(Long id) {
        Grammar grammar = getById(id);
        if (grammar != null) {
            grammar.setDeletedAt(LocalDateTime.now());
            grammarRepository.save(grammar);
        }
    }
}