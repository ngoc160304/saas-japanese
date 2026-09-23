package com.mycompany.saas_japanese.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
import com.mycompany.saas_japanese.service.JlptExamService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/jlptExams")
@RequiredArgsConstructor
public class JlptExamController {

    private final JlptExamService jlptExamService;

    @GetMapping("/{id}")
    public ResponseEntity<JlptExamResponse> fetchJlptExamById(
            @PathVariable("id") Long id) {
        JlptExamResponse jlptExam = jlptExamService.fetchJlptExamById(id);
        return ResponseEntity.ok(jlptExam);
    }

    @GetMapping
    public ResponseEntity<Page<JlptExamResponse>> fetchAllJlptExam(JlptExamQuery query) {
        Page<JlptExamResponse> jlptExam = jlptExamService.fetchAllJlptExam(query);
        return ResponseEntity.ok(jlptExam);
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<JlptExamDetailResponse> fetchJlptExamDetail(
            @PathVariable("id") Long id) {
        JlptExamDetailResponse response = jlptExamService.fetchJlptExamDetail(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{examId}/sessions/{sessionId}")
    public ResponseEntity<JlptExamSessionResponse> fetchJlptExamSession(
            @PathVariable("examId") Long examId,
            @PathVariable("sessionId") Long sessionId) {

        JlptExamSessionResponse response = jlptExamService.fetchJlptExamSession(
                examId,
                sessionId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{examId}/attempts")
    public ResponseEntity<StartJlptAttemptResponse> startAttempt(
            @PathVariable("examId") Long examId,
            @Valid @RequestBody ReqStartJjptAttempt request) {
        StartJlptAttemptResponse response = jlptExamService.startAttempt(
                examId,
                request);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/attempts/{attemptId}/sessions/{attemptSessionId}/answers")
    public ResponseEntity<SaveJlptAnswerResponse> saveAnswer(
            @PathVariable("attemptId") Long attemptId,
            @PathVariable("attemptSessionId") Long attemptSessionId,
            @Valid @RequestBody ReqSaveJlptAnswer request) {
        SaveJlptAnswerResponse response = jlptExamService.saveAnswer(
                attemptId,
                attemptSessionId,
                request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<SubmitJlptAttemptResponse> submitAttempt(
            @PathVariable("attemptId") Long attemptId) {
        SubmitJlptAttemptResponse response = jlptExamService.submitAttempt(attemptId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attempts/{attemptId}/result")
    public ResponseEntity<JlptAttemptResultResponse> getAttemptResult(
            @PathVariable("attemptId") Long attemptId) {
        JlptAttemptResultResponse response = jlptExamService.getAttemptResult(attemptId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attempts/{attemptId}/review")
    public ResponseEntity<JlptAttemptReviewResponse> getAttemptReview(
            @PathVariable("attemptId") Long attemptId) {
        JlptAttemptReviewResponse response = jlptExamService.getAttemptReview(attemptId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attempts/history")
    public ResponseEntity<Page<JlptAttemptHistoryResponse>> getAttemptHistory(
            @Valid JlptAttemptHistoryQuery query) {
        Page<JlptAttemptHistoryResponse> response = jlptExamService.getAttemptHistory(query);
        return ResponseEntity.ok(response);
    }

}
