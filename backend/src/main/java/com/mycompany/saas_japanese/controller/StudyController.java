package com.mycompany.saas_japanese.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.request.ReqUpdateLessonProgress;
import com.mycompany.saas_japanese.domain.response.CourseProgressResponse;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import com.mycompany.saas_japanese.domain.response.LessonProgressResponse;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.domain.response.QuizAnswerResponse;
import com.mycompany.saas_japanese.domain.response.QuizResponse;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;
import com.mycompany.saas_japanese.service.StudyService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/study")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class StudyController {

    StudyService studyService;

    @GetMapping("/courses/{courseId}/lessons")
    public ResponseEntity<List<LessonResponse>> getLessonsByCourse(
            @PathVariable("courseId") Long courseId) {

        return ResponseEntity.ok(studyService.getLessonsByCourse(courseId));
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<LessonResponse> getLessonDetail(
            @PathVariable("lessonId") Long lessonId) {

        return ResponseEntity.ok(studyService.getLessonDetail(lessonId));
    }

    @GetMapping("/lessons/{lessonId}/vocabularies")
    public ResponseEntity<List<VocabularyResponse>> getVocabularies(
            @PathVariable("lessonId") Long lessonId) {

        return ResponseEntity.ok(studyService.getVocabularies(lessonId));
    }

    @GetMapping("/lessons/{lessonId}/kanjis")
    public ResponseEntity<List<KanjiResponse>> getKanjis(
            @PathVariable("lessonId") Long lessonId) {

        return ResponseEntity.ok(studyService.getKanjis(lessonId));
    }

    @GetMapping("/lessons/{lessonId}/quiz")
    public ResponseEntity<QuizResponse> getQuiz(
            @PathVariable("lessonId") Long lessonId) {

        return ResponseEntity.ok(
                studyService.getQuiz(lessonId));
    }

    @PostMapping("/lessons/{lessonId}/quiz/{quizId}/questions/{questionId}/answer")
    public ResponseEntity<QuizAnswerResponse> answerQuestion(
            @PathVariable("lessonId") Long lessonId,
            @PathVariable("quizId") Long quizId,
            @PathVariable("questionId") Long questionId,
            @RequestParam("optionId") Long optionId) {

        return ResponseEntity.ok(
                studyService.answerQuestion(lessonId,quizId,questionId,optionId));
        }

        @PostMapping("/lessons/{lessonId}/progress")
        public ResponseEntity<LessonProgressResponse> updateLessonProgress(
                @PathVariable("lessonId") Long lessonId,
                @Valid @RequestBody ReqUpdateLessonProgress request) {

        return ResponseEntity.ok(studyService.updateLessonProgress(lessonId,request));
        }

        @GetMapping("/lessons/{lessonId}/progress")
        public ResponseEntity<LessonProgressResponse> getLessonProgress(
                @PathVariable("lessonId") Long lessonId) {

        return ResponseEntity.ok(studyService.getLessonProgress(lessonId));
        }

        @GetMapping("/courses/{courseId}/progress")
        public ResponseEntity<CourseProgressResponse> getCourseProgress(
                @PathVariable("courseId") Long courseId) {

        return ResponseEntity.ok(studyService.getCourseProgress(courseId));
        }
}
