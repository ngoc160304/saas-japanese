package com.mycompany.saas_japanese.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.query.JlptExamQuery;
import com.mycompany.saas_japanese.domain.request.ReqStartJjptAttempt;
import com.mycompany.saas_japanese.domain.response.JlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamSessionResponse;
import com.mycompany.saas_japanese.domain.response.StartJlptAttemptResponse;
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

}
