
package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.service.KanjiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kanjis")
public class KanjiController {
    @Autowired
    private KanjiService service;

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
        Kanji data = service.getById(id);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Kanji entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Kanji entity) {
        Kanji data = service.update(id, entity);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Deleted");
    }
}