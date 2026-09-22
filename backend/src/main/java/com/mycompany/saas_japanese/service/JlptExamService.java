package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.query.JlptExamQuery;
import com.mycompany.saas_japanese.domain.request.ReqStartJjptAttempt;
import com.mycompany.saas_japanese.domain.response.JlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamSessionResponse;
import com.mycompany.saas_japanese.domain.response.StartJlptAttemptResponse;

public interface JlptExamService {
  JlptExamResponse fetchJlptExamById(Long id);

  Page<JlptExamResponse> fetchAllJlptExam(JlptExamQuery query);

  JlptExamDetailResponse fetchJlptExamDetail(Long id);

  JlptExamSessionResponse fetchJlptExamSession(Long examId, Long sessionId);

  StartJlptAttemptResponse startAttempt(
      Long examId,
      ReqStartJjptAttempt request);
}
