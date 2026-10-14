package com.mycompany.saas_japanese.controller;

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

import com.mycompany.saas_japanese.domain.request.ReqAdminLessonQuiz;
import com.mycompany.saas_japanese.domain.request.ReqQuizPublication;
import com.mycompany.saas_japanese.domain.request.ReqQuizQuestion;
import com.mycompany.saas_japanese.domain.request.ReqQuizQuestionOrder;
import com.mycompany.saas_japanese.domain.response.AdminLessonQuizResponse;
import com.mycompany.saas_japanese.service.AdminLessonQuizService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.AccessLevel;

@Validated
@RestController
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@RequestMapping("/admin/lessons/{lessonId}/quiz")
public class AdminLessonQuizController {
  private final AdminLessonQuizService service;

  @GetMapping
  @ApiMessage("Fetch admin lesson quiz")
  public ResponseEntity<AdminLessonQuizResponse> findCurrent(@Positive @PathVariable("lessonId") Long lessonId) {
    return service.findCurrent(lessonId).map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.noContent().build());
  }

  @PostMapping
  @ApiMessage("Create lesson quiz")
  public ResponseEntity<AdminLessonQuizResponse> create(@Positive @PathVariable("lessonId") Long lessonId,
      @Valid @RequestBody ReqAdminLessonQuiz request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(lessonId, request));
  }

  @PutMapping("/{quizId}")
  @ApiMessage("Update lesson quiz metadata")
  public ResponseEntity<AdminLessonQuizResponse> update(@Positive @PathVariable("lessonId") Long lessonId,
      @Positive @PathVariable("quizId") Long quizId, @Valid @RequestBody ReqAdminLessonQuiz request) {
    return ResponseEntity.ok(service.update(lessonId, quizId, request));
  }

  @PatchMapping("/{quizId}/publication")
  @ApiMessage("Update quiz publication")
  public ResponseEntity<AdminLessonQuizResponse> publish(@Positive @PathVariable("lessonId") Long lessonId,
      @Positive @PathVariable("quizId") Long quizId, @Valid @RequestBody ReqQuizPublication request) {
    return ResponseEntity.ok(service.publish(lessonId, quizId, request.isPublished()));
  }

  @DeleteMapping("/{quizId}")
  @ApiMessage("Delete lesson quiz")
  public ResponseEntity<Void> delete(@Positive @PathVariable("lessonId") Long lessonId,
      @Positive @PathVariable("quizId") Long quizId) {
    service.delete(lessonId, quizId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{quizId}/questions")
  @ApiMessage("Create quiz question")
  public ResponseEntity<AdminLessonQuizResponse> createQuestion(@Positive @PathVariable("lessonId") Long lessonId,
      @Positive @PathVariable("quizId") Long quizId, @Valid @RequestBody ReqQuizQuestion request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.createQuestion(lessonId, quizId, request));
  }

  @PutMapping("/{quizId}/questions/{questionId}")
  @ApiMessage("Update quiz question")
  public ResponseEntity<AdminLessonQuizResponse> updateQuestion(@Positive @PathVariable("lessonId") Long lessonId,
      @Positive @PathVariable("quizId") Long quizId, @Positive @PathVariable("questionId") Long questionId,
      @Valid @RequestBody ReqQuizQuestion request) {
    return ResponseEntity.ok(service.updateQuestion(lessonId, quizId, questionId, request));
  }

  @DeleteMapping("/{quizId}/questions/{questionId}")
  @ApiMessage("Delete quiz question")
  public ResponseEntity<Void> deleteQuestion(@Positive @PathVariable("lessonId") Long lessonId,
      @Positive @PathVariable("quizId") Long quizId, @Positive @PathVariable("questionId") Long questionId) {
    service.deleteQuestion(lessonId, quizId, questionId);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/{quizId}/questions/order")
  @ApiMessage("Reorder quiz questions")
  public ResponseEntity<AdminLessonQuizResponse> reorder(@Positive @PathVariable("lessonId") Long lessonId,
      @Positive @PathVariable("quizId") Long quizId, @Valid @RequestBody ReqQuizQuestionOrder request) {
    return ResponseEntity.ok(service.reorder(lessonId, quizId, request.questionIds()));
  }
}
