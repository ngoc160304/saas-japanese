// File: VocabularyController.java
package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.service.VocabularyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/vocabularies")
public class VocabularyController {
    @Autowired
    private VocabularyService service;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<?> getByLesson(@PathVariable Long lessonId) {
        return ResponseEntity.ok(service.getByLesson(lessonId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Vocabulary data = service.getById(id);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Vocabulary entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Vocabulary entity) {
        Vocabulary data = service.update(id, entity);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Deleted");
    }

    @PostMapping("/import-excel")
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
