package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.query.KanjiQuery;
import com.mycompany.saas_japanese.domain.request.ReqKanji;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;

import org.springframework.data.domain.Page;

public interface KanjiService {

  KanjiResponse create(ReqKanji request);

  KanjiResponse findById(Long id);

  Page<KanjiResponse> findAll(KanjiQuery query);

  KanjiResponse update(Long id, ReqKanji request);

  void delete(Long id);
}
