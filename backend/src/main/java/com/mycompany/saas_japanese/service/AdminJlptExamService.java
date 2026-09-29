package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.query.AdminJlptExamQuery;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptAnswer;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptExam;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptPart;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptQuestion;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptSession;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamSummaryResponse;

public interface AdminJlptExamService {
  Page<AdminJlptExamSummaryResponse> findAll(AdminJlptExamQuery query);

  AdminJlptExamDetailResponse findById(Long examId);

  AdminJlptExamDetailResponse create(ReqAdminJlptExam request);

  AdminJlptExamDetailResponse update(Long examId, ReqAdminJlptExam request);

  AdminJlptExamDetailResponse publish(Long examId);

  AdminJlptExamDetailResponse unpublish(Long examId);

  void delete(Long examId);

  AdminJlptExamDetailResponse.SessionResponse findSession(Long examId, Long sessionId);

  AdminJlptExamDetailResponse.SessionResponse createSession(Long examId, ReqAdminJlptSession request);

  AdminJlptExamDetailResponse.SessionResponse updateSession(
      Long examId, Long sessionId, ReqAdminJlptSession request);

  AdminJlptExamDetailResponse.SessionResponse updateSessionSortOrder(
      Long examId, Long sessionId, Integer sortOrder);

  void deleteSession(Long examId, Long sessionId);

  AdminJlptExamDetailResponse.PartResponse findPart(Long examId, Long sessionId, Long partId);

  AdminJlptExamDetailResponse.PartResponse createPart(
      Long examId, Long sessionId, ReqAdminJlptPart request);

  AdminJlptExamDetailResponse.PartResponse updatePart(
      Long examId, Long sessionId, Long partId, ReqAdminJlptPart request);

  AdminJlptExamDetailResponse.PartResponse updatePartSortOrder(
      Long examId, Long sessionId, Long partId, Integer sortOrder);

  void deletePart(Long examId, Long sessionId, Long partId);

  AdminJlptExamDetailResponse.QuestionResponse findQuestion(
      Long examId, Long sessionId, Long partId, Long questionId);

  AdminJlptExamDetailResponse.QuestionResponse createQuestion(
      Long examId, Long sessionId, Long partId, ReqAdminJlptQuestion request);

  AdminJlptExamDetailResponse.QuestionResponse updateQuestion(
      Long examId, Long sessionId, Long partId, Long questionId, ReqAdminJlptQuestion request);

  AdminJlptExamDetailResponse.QuestionResponse updateQuestionSortOrder(
      Long examId, Long sessionId, Long partId, Long questionId, Integer sortOrder);

  void deleteQuestion(Long examId, Long sessionId, Long partId, Long questionId);

  AdminJlptExamDetailResponse.AnswerResponse findAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId);

  AdminJlptExamDetailResponse.AnswerResponse createAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, ReqAdminJlptAnswer request);

  AdminJlptExamDetailResponse.AnswerResponse updateAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId,
      ReqAdminJlptAnswer request);

  AdminJlptExamDetailResponse.AnswerResponse updateAnswerSortOrder(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId,
      Integer sortOrder);

  void deleteAnswer(Long examId, Long sessionId, Long partId, Long questionId, Long answerId);
}
