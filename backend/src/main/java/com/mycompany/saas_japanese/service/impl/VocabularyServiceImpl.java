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
import java.util.ArrayList;
import java.util.List;

@Service
public class VocabularyServiceImpl implements VocabularyService {

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Override
    public List<Vocabulary> getAll() {
        return vocabularyRepository.findAll();
    }

    @Override
    public List<Vocabulary> getByLesson(Long lessonId) {
        return vocabularyRepository.findByLessonIdOrderBySortOrderAsc(lessonId);
    }

    @Override
    public Vocabulary getById(Long id) {
        return vocabularyRepository.findById(id).orElse(null);
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
            vocab.setMediaId(details.getMediaId());
            vocab.setTerm(details.getTerm());
            vocab.setKanji(details.getKanji());
            vocab.setMeaning(details.getMeaning());
            vocab.setRomaji(details.getRomaji());
            vocab.setExampleSentence(details.getExampleSentence());
            vocab.setExampleMeaning(details.getExampleMeaning());
            vocab.setSortOrder(details.getSortOrder());
            return vocabularyRepository.save(vocab);
        }
        return null;
    }

    @Override
    public void delete(Long id) {
        vocabularyRepository.deleteById(id);
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
                String term = getCellString(row.getCell(2));
                if (term == null || term.isBlank())
                    continue;

                Vocabulary vocab = new Vocabulary();
                // Cột 1: lesson_id
                vocab.setLessonId(getCellLong(row.getCell(1)));
                // Cột 2: term
                vocab.setTerm(term);
                // Cột 3: kanji
                vocab.setKanji(getCellString(row.getCell(3)));
                // Cột 4: meaning
                vocab.setMeaning(getCellString(row.getCell(4)));
                // Cột 5: romaji
                vocab.setRomaji(getCellString(row.getCell(5)));

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
