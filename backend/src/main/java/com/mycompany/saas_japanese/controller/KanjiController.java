package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.query.KanjiQuery;
import com.mycompany.saas_japanese.domain.request.ReqKanji;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import com.mycompany.saas_japanese.service.KanjiService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/kanjis")
@RequiredArgsConstructor
public class KanjiController {

  private final KanjiService kanjiService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public KanjiResponse create(
      @Valid @RequestBody ReqKanji request) {
    return kanjiService.create(request);
  }

  @GetMapping
  public Page<KanjiResponse> findAll(
      @Valid @ModelAttribute KanjiQuery query) {
    return kanjiService.findAll(query);
  }

  @GetMapping("/{id}")
  public KanjiResponse findById(
      @PathVariable("id") Long id,
      @RequestParam(value = "lessonId", required = false) Long lessonId) {
    return kanjiService.findById(id, lessonId);
  }

  @PutMapping("/{id}")
  public KanjiResponse update(
      @PathVariable("id") Long id,
      @Valid @RequestBody ReqKanji request,
      @RequestParam(value = "lessonId", required = false) Long lessonId) {
    return kanjiService.update(id, request, lessonId);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable("id") Long id,
      @RequestParam(value = "lessonId", required = false) Long lessonId) {
    kanjiService.delete(id, lessonId);
  }
}
