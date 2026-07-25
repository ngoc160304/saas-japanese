
package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.service.KanjiService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.mycompany.saas_japanese.domain.request.ReqCreateKanji;
import com.mycompany.saas_japanese.domain.request.ReqUpdateKanji;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import com.mycompany.saas_japanese.service.mapper.KanjiMapper;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/kanjis")
public class KanjiController {
    @Autowired
    private KanjiService service;

    @Autowired
    private KanjiMapper kanjiMapper;

    @GetMapping
    @ApiMessage("Get all kanjis")
    public ResponseEntity<List<KanjiResponse>> getAll() {
        return ResponseEntity.ok(service.getAll().stream().map(kanjiMapper::toResponse).toList());
    }

    @GetMapping("/lesson/{lessonId}")
    @ApiMessage("Get kanjis by lesson")
    public ResponseEntity<List<KanjiResponse>> getByLesson(@PathVariable Long lessonId) {
        return ResponseEntity.ok(service.getByLesson(lessonId).stream().map(kanjiMapper::toResponse).toList());
    }

    @GetMapping("/{id}")
    @ApiMessage("Get kanji by ID")
    public ResponseEntity<KanjiResponse> getById(@PathVariable Long id) {
        Kanji data = service.getById(id);
        return data != null ? ResponseEntity.ok(kanjiMapper.toResponse(data)) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @ApiMessage("Create new kanji")
    public ResponseEntity<KanjiResponse> create(@Valid @RequestBody ReqCreateKanji request) {
        Kanji entity = kanjiMapper.toEntity(request);
        Kanji saved = service.create(entity);
        return ResponseEntity.ok(kanjiMapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update kanji")
    public ResponseEntity<KanjiResponse> update(@PathVariable Long id, @Valid @RequestBody ReqUpdateKanji request) {
        Kanji kanji = service.getById(id);
        if (kanji == null) return ResponseEntity.notFound().build();
        kanjiMapper.updateEntity(kanji, request);
        Kanji updated = service.update(id, kanji);
        return ResponseEntity.ok(kanjiMapper.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete kanji")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Success"));
    }
}