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
      @ModelAttribute KanjiQuery query) {
    return kanjiService.findAll(query);
  }

  @GetMapping("/{id}")
  public KanjiResponse findById(
      @PathVariable("id") Long id) {
    return kanjiService.findById(id);
  }

  @PutMapping("/{id}")
  public KanjiResponse update(
      @PathVariable("id") Long id,
      @Valid @RequestBody ReqKanji request) {
    return kanjiService.update(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable("id") Long id) {
    kanjiService.delete(id);
  }
}
