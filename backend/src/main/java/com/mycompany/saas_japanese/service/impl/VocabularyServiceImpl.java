package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.repository.VocabularyRepository;
import com.mycompany.saas_japanese.service.VocabularyService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Override
    public List<Vocabulary> importFromExcel(MultipartFile file) throws IOException {
        List<Vocabulary> result = new ArrayList<>();

        try (InputStream is = file.getInputStream();
                Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                String word = getCellString(row.getCell(2));
                if (word == null || word.isBlank())
                    continue;

                Vocabulary vocab = new Vocabulary();

                // cot 1 lesson id
                vocab.setLessonId(getCellLong(row.getCell(1)));
                // Cột 2: word
                vocab.setWord(word);
                // Cột 3: reading
                vocab.setReading(getCellString(row.getCell(3)));
                // Cột 4: meaning_vi
                vocab.setMeaningVi(getCellString(row.getCell(4)));

                result.add(vocab);
            }
        }

        return vocabularyRepository.saveAll(result);
    }

    private String getCellString(Cell cell) {
        if (cell == null)
            return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    private Long getCellLong(Cell cell) {
        if (cell == null)
            return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> (long) cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Long.parseLong(cell.getStringCellValue().trim());
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }
}
