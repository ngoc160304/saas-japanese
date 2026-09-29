package com.mycompany.saas_japanese.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.query.AdminJlptExamQuery;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptAnswer;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptExam;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptPart;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptQuestion;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptSession;
import com.mycompany.saas_japanese.domain.request.ReqJlptSortOrder;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamSummaryResponse;
import com.mycompany.saas_japanese.service.AdminJlptExamService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/jlpt-exams")
public class AdminJlptExamController {
  private final AdminJlptExamService service;

  @GetMapping
  @ApiMessage("Fetch admin JLPT exams")
  public ResponseEntity<Page<AdminJlptExamSummaryResponse>> findAll(
      @Valid AdminJlptExamQuery query) {
    return ResponseEntity.ok(service.findAll(query));
  }

  @GetMapping("/{examId}")
  @ApiMessage("Fetch admin JLPT exam detail")
  public ResponseEntity<AdminJlptExamDetailResponse> findById(
      @Positive @PathVariable Long examId) {
    return ResponseEntity.ok(service.findById(examId));
  }

  @PostMapping
  @ApiMessage("Create JLPT exam")
  public ResponseEntity<AdminJlptExamDetailResponse> create(
      @Valid @RequestBody ReqAdminJlptExam request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
  }

  @PutMapping("/{examId}")
  @ApiMessage("Update JLPT exam")
  public ResponseEntity<AdminJlptExamDetailResponse> update(
      @Positive @PathVariable Long examId,
      @Valid @RequestBody ReqAdminJlptExam request) {
    return ResponseEntity.ok(service.update(examId, request));
  }

  @PostMapping("/{examId}/publish")
  @ApiMessage("Publish JLPT exam")
  public ResponseEntity<AdminJlptExamDetailResponse> publish(
      @Positive @PathVariable Long examId) {
    return ResponseEntity.ok(service.publish(examId));
  }

  @PostMapping("/{examId}/unpublish")
  @ApiMessage("Unpublish JLPT exam")
  public ResponseEntity<AdminJlptExamDetailResponse> unpublish(
      @Positive @PathVariable Long examId) {
    return ResponseEntity.ok(service.unpublish(examId));
  }

  @DeleteMapping("/{examId}")
  @ApiMessage("Archive JLPT exam")
  public ResponseEntity<Void> delete(@Positive @PathVariable Long examId) {
    service.delete(examId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{examId}/sessions/{sessionId}")
  @ApiMessage("Fetch JLPT exam session")
  public ResponseEntity<AdminJlptExamDetailResponse.SessionResponse> findSession(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId) {
    return ResponseEntity.ok(service.findSession(examId, sessionId));
  }

  @PostMapping("/{examId}/sessions")
  @ApiMessage("Create JLPT exam session")
  public ResponseEntity<AdminJlptExamDetailResponse.SessionResponse> createSession(
      @Positive @PathVariable Long examId,
      @Valid @RequestBody ReqAdminJlptSession request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.createSession(examId, request));
  }

  @PutMapping("/{examId}/sessions/{sessionId}")
  @ApiMessage("Update JLPT exam session")
  public ResponseEntity<AdminJlptExamDetailResponse.SessionResponse> updateSession(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Valid @RequestBody ReqAdminJlptSession request) {
    return ResponseEntity.ok(service.updateSession(examId, sessionId, request));
  }

  @PatchMapping("/{examId}/sessions/{sessionId}/sort-order")
  @ApiMessage("Update JLPT exam session sort order")
  public ResponseEntity<AdminJlptExamDetailResponse.SessionResponse> updateSessionSortOrder(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Valid @RequestBody ReqJlptSortOrder request) {
    return ResponseEntity.ok(service.updateSessionSortOrder(
        examId, sessionId, request.getSortOrder()));
  }

  @DeleteMapping("/{examId}/sessions/{sessionId}")
  @ApiMessage("Delete JLPT exam session")
  public ResponseEntity<Void> deleteSession(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId) {
    service.deleteSession(examId, sessionId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{examId}/sessions/{sessionId}/parts/{partId}")
  @ApiMessage("Fetch JLPT exam part")
  public ResponseEntity<AdminJlptExamDetailResponse.PartResponse> findPart(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId) {
    return ResponseEntity.ok(service.findPart(examId, sessionId, partId));
  }

  @PostMapping("/{examId}/sessions/{sessionId}/parts")
  @ApiMessage("Create JLPT exam part")
  public ResponseEntity<AdminJlptExamDetailResponse.PartResponse> createPart(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Valid @RequestBody ReqAdminJlptPart request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(
        service.createPart(examId, sessionId, request));
  }

  @PutMapping("/{examId}/sessions/{sessionId}/parts/{partId}")
  @ApiMessage("Update JLPT exam part")
  public ResponseEntity<AdminJlptExamDetailResponse.PartResponse> updatePart(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Valid @RequestBody ReqAdminJlptPart request) {
    return ResponseEntity.ok(service.updatePart(examId, sessionId, partId, request));
  }

  @PatchMapping("/{examId}/sessions/{sessionId}/parts/{partId}/sort-order")
  @ApiMessage("Update JLPT exam part sort order")
  public ResponseEntity<AdminJlptExamDetailResponse.PartResponse> updatePartSortOrder(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Valid @RequestBody ReqJlptSortOrder request) {
    return ResponseEntity.ok(service.updatePartSortOrder(
        examId, sessionId, partId, request.getSortOrder()));
  }

  @DeleteMapping("/{examId}/sessions/{sessionId}/parts/{partId}")
  @ApiMessage("Delete JLPT exam part")
  public ResponseEntity<Void> deletePart(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId) {
    service.deletePart(examId, sessionId, partId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}")
  @ApiMessage("Fetch JLPT exam question")
  public ResponseEntity<AdminJlptExamDetailResponse.QuestionResponse> findQuestion(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId) {
    return ResponseEntity.ok(service.findQuestion(examId, sessionId, partId, questionId));
  }

  @PostMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions")
  @ApiMessage("Create JLPT exam question")
  public ResponseEntity<AdminJlptExamDetailResponse.QuestionResponse> createQuestion(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Valid @RequestBody ReqAdminJlptQuestion request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(
        service.createQuestion(examId, sessionId, partId, request));
  }

  @PutMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}")
  @ApiMessage("Update JLPT exam question")
  public ResponseEntity<AdminJlptExamDetailResponse.QuestionResponse> updateQuestion(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId,
      @Valid @RequestBody ReqAdminJlptQuestion request) {
    return ResponseEntity.ok(service.updateQuestion(
        examId, sessionId, partId, questionId, request));
  }

  @PatchMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/sort-order")
  @ApiMessage("Update JLPT exam question sort order")
  public ResponseEntity<AdminJlptExamDetailResponse.QuestionResponse> updateQuestionSortOrder(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId,
      @Valid @RequestBody ReqJlptSortOrder request) {
    return ResponseEntity.ok(service.updateQuestionSortOrder(
        examId, sessionId, partId, questionId, request.getSortOrder()));
  }

  @DeleteMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}")
  @ApiMessage("Delete JLPT exam question")
  public ResponseEntity<Void> deleteQuestion(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId) {
    service.deleteQuestion(examId, sessionId, partId, questionId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/answers/{answerId}")
  @ApiMessage("Fetch JLPT exam answer")
  public ResponseEntity<AdminJlptExamDetailResponse.AnswerResponse> findAnswer(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId,
      @Positive @PathVariable Long answerId) {
    return ResponseEntity.ok(service.findAnswer(
        examId, sessionId, partId, questionId, answerId));
  }

  @PostMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/answers")
  @ApiMessage("Create JLPT exam answer")
  public ResponseEntity<AdminJlptExamDetailResponse.AnswerResponse> createAnswer(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId,
      @Valid @RequestBody ReqAdminJlptAnswer request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(
        service.createAnswer(examId, sessionId, partId, questionId, request));
  }

  @PutMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/answers/{answerId}")
  @ApiMessage("Update JLPT exam answer")
  public ResponseEntity<AdminJlptExamDetailResponse.AnswerResponse> updateAnswer(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId,
      @Positive @PathVariable Long answerId,
      @Valid @RequestBody ReqAdminJlptAnswer request) {
    return ResponseEntity.ok(service.updateAnswer(
        examId, sessionId, partId, questionId, answerId, request));
  }

  @PatchMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/answers/{answerId}/sort-order")
  @ApiMessage("Update JLPT exam answer sort order")
  public ResponseEntity<AdminJlptExamDetailResponse.AnswerResponse> updateAnswerSortOrder(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId,
      @Positive @PathVariable Long answerId,
      @Valid @RequestBody ReqJlptSortOrder request) {
    return ResponseEntity.ok(service.updateAnswerSortOrder(
        examId, sessionId, partId, questionId, answerId, request.getSortOrder()));
  }

  @DeleteMapping("/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/answers/{answerId}")
  @ApiMessage("Delete JLPT exam answer")
  public ResponseEntity<Void> deleteAnswer(
      @Positive @PathVariable Long examId,
      @Positive @PathVariable Long sessionId,
      @Positive @PathVariable Long partId,
      @Positive @PathVariable Long questionId,
      @Positive @PathVariable Long answerId) {
    service.deleteAnswer(examId, sessionId, partId, questionId, answerId);
    return ResponseEntity.noContent().build();
  }
}
