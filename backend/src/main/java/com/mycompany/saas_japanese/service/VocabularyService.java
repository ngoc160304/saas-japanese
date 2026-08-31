package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.query.VocabularyQuery;
import com.mycompany.saas_japanese.domain.request.ReqVocabulary;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;

public interface VocabularyService {

  VocabularyResponse create(ReqVocabulary request);

  Page<VocabularyResponse> findAll(VocabularyQuery query);

  VocabularyResponse findById(Long id);

  VocabularyResponse update(
      Long id,
      ReqVocabulary request);

  void delete(Long id);
}
