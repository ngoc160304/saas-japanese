
package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lessons")
public class LessonController {
    @Autowired
    private LessonService service;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(service.getByCourse(courseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Lesson data = service.getById(id);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Lesson entity) {
        Lesson savedLesson = service.create(entity);
        return ResponseEntity.ok(savedLesson);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Lesson entity) {
        Lesson data = service.update(id, entity);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Deleted");
    }
}