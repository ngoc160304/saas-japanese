package com.mycompany.saas_japanese.controller;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.mycompany.saas_japanese.domain.query.VocabularyQuery;
import com.mycompany.saas_japanese.domain.request.ReqVocabulary;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;
import com.mycompany.saas_japanese.service.VocabularyService;

@RestController
@RequestMapping("/vocabularies")
@RequiredArgsConstructor
public class VocabularyController {

  private final VocabularyService vocabularyService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public VocabularyResponse create(
      @Valid @RequestBody ReqVocabulary request) {

    return vocabularyService.create(request);
  }

  @GetMapping
  public Page<VocabularyResponse> findAll(
      @ModelAttribute VocabularyQuery query) {

    return vocabularyService.findAll(query);
  }

  @GetMapping("/{id}")
  public VocabularyResponse findById(
      @PathVariable Long id) {

    return vocabularyService.findById(id);
  }

  @PutMapping("/{id}")
  public VocabularyResponse update(
      @PathVariable Long id,
      @Valid @RequestBody ReqVocabulary request) {

    return vocabularyService.update(
        id,
        request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable Long id) {

    vocabularyService.delete(id);
  }
}
