package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.Vocabulary;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface VocabularyService {
    List<Vocabulary> getAll();

    List<Vocabulary> getByLesson(Long lessonId);

    Vocabulary getById(Long id);

    Vocabulary create(Vocabulary vocabulary);

    Vocabulary update(Long id, Vocabulary vocabDetails);

    void delete(Long id);

    List<Vocabulary> importFromExcel(MultipartFile file) throws IOException;
}