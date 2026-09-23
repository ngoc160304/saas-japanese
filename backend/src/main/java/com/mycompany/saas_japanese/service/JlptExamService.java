package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.query.JlptAttemptHistoryQuery;
import com.mycompany.saas_japanese.domain.query.JlptExamQuery;
import com.mycompany.saas_japanese.domain.request.ReqSaveJlptAnswer;
import com.mycompany.saas_japanese.domain.request.ReqStartJjptAttempt;
import com.mycompany.saas_japanese.domain.response.JlptAttemptHistoryResponse;
import com.mycompany.saas_japanese.domain.response.JlptAttemptReviewResponse;
import com.mycompany.saas_japanese.domain.response.JlptAttemptResultResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamSessionResponse;
import com.mycompany.saas_japanese.domain.response.SaveJlptAnswerResponse;
import com.mycompany.saas_japanese.domain.response.StartJlptAttemptResponse;
import com.mycompany.saas_japanese.domain.response.SubmitJlptAttemptResponse;

public interface JlptExamService {
  JlptExamResponse fetchJlptExamById(Long id);

  Page<JlptExamResponse> fetchAllJlptExam(JlptExamQuery query);

  JlptExamDetailResponse fetchJlptExamDetail(Long id);

  JlptExamSessionResponse fetchJlptExamSession(Long examId, Long sessionId);

  StartJlptAttemptResponse startAttempt(
      Long examId,
      ReqStartJjptAttempt request);

  SaveJlptAnswerResponse saveAnswer(
      Long attemptId,
      Long attemptSessionId,
      ReqSaveJlptAnswer request);

  SubmitJlptAttemptResponse submitAttempt(Long attemptId);

  JlptAttemptResultResponse getAttemptResult(Long attemptId);

  JlptAttemptReviewResponse getAttemptReview(Long attemptId);

  Page<JlptAttemptHistoryResponse> getAttemptHistory(JlptAttemptHistoryQuery query);
}
