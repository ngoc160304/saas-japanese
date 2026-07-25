
package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Grammar;
import com.mycompany.saas_japanese.service.GrammarService;
import com.mycompany.saas_japanese.service.impl.GrammarServiceImpl;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/grammars")
public class GrammarController {
    private final GrammarServiceImpl grammarServiceImpl;
    @Autowired
    private GrammarService service;

    GrammarController(GrammarServiceImpl grammarServiceImpl) {
        this.grammarServiceImpl = grammarServiceImpl;
    }

    @GetMapping
    @ApiMessage("Get all grammars")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/lesson/{lessonId}")
    @ApiMessage("Get grammars by lesson")
    public ResponseEntity<?> getByLesson(@PathVariable Long lessonId) {
        return ResponseEntity.ok(service.getByLesson(lessonId));
    }

    @GetMapping("/{id}")
    @ApiMessage("Get grammar by ID")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Grammar data = service.getById(id);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @ApiMessage("Create new grammar")
    public ResponseEntity<?> create(@RequestBody Grammar entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update grammar")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Grammar entity) {
        Grammar data = service.update(id, entity);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete grammar")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        this.grammarServiceImpl.delete(id);
        return ResponseEntity.ok("Xoa thanh cong");
    }
}