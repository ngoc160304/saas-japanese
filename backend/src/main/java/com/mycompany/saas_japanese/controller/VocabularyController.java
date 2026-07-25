// File: VocabularyController.java
package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.service.VocabularyService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.mycompany.saas_japanese.domain.request.ReqCreateVocabulary;
import com.mycompany.saas_japanese.domain.request.ReqUpdateVocabulary;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;
import com.mycompany.saas_japanese.service.mapper.VocabularyMapper;
import jakarta.validation.Valid;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/vocabularies")
public class VocabularyController {
    @Autowired
    private VocabularyService service;

    @Autowired
    private VocabularyMapper vocabularyMapper;

    @GetMapping
    @ApiMessage("Get all vocabularies")
    public ResponseEntity<List<VocabularyResponse>> getAll() {
        return ResponseEntity.ok(service.getAll().stream().map(vocabularyMapper::toResponse).toList());
    }

    @GetMapping("/lesson/{lessonId}")
    @ApiMessage("Get vocabularies by lesson")
    public ResponseEntity<List<VocabularyResponse>> getByLesson(@PathVariable Long lessonId) {
        return ResponseEntity.ok(service.getByLesson(lessonId).stream().map(vocabularyMapper::toResponse).toList());
    }

    @GetMapping("/{id}")
    @ApiMessage("Get vocabulary by ID")
    public ResponseEntity<VocabularyResponse> getById(@PathVariable Long id) {
        Vocabulary data = service.getById(id);
        return data != null ? ResponseEntity.ok(vocabularyMapper.toResponse(data)) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @ApiMessage("Create new vocabulary")
    public ResponseEntity<VocabularyResponse> create(@Valid @RequestBody ReqCreateVocabulary request) {
        Vocabulary entity = vocabularyMapper.toEntity(request);
        Vocabulary saved = service.create(entity);
        return ResponseEntity.ok(vocabularyMapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update vocabulary")
    public ResponseEntity<VocabularyResponse> update(@PathVariable Long id, @Valid @RequestBody ReqUpdateVocabulary request) {
        Vocabulary voc = service.getById(id);
        if (voc == null) return ResponseEntity.notFound().build();
        vocabularyMapper.updateEntity(voc, request);
        Vocabulary updated = service.update(id, voc);
        return ResponseEntity.ok(vocabularyMapper.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete vocabulary")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Success"));
    }

    @PostMapping("/import-excel")
    @ApiMessage("Import vocabularies from Excel file")
    public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File không được để trống"));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ hỗ trợ file .xlsx"));
        }
        try {
            List<Vocabulary> saved = service.importFromExcel(file);
            return ResponseEntity.ok(Map.of(
                    "message", "Import thành công",
                    "count", saved.size(),
                    "data", saved));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Lỗi đọc file: " + e.getMessage()));
        }
    }
}
