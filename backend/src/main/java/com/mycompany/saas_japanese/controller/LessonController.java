package com.mycompany.saas_japanese.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.query.LessonQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateLesson;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLesson;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.service.LessonService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/lessons")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class LessonController {

  private final LessonService lessonService;

  @PostMapping
  public ResponseEntity<LessonResponse> createLesson(
      @RequestBody ReqCreateLesson request) {
    LessonResponse lesson = lessonService.createLesson(request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(lesson);
  }

  @GetMapping("/{id}")
  public ResponseEntity<LessonResponse> fetchLessonById(
      @PathVariable Long id) {
    LessonResponse lesson = lessonService.fetchLessonById(id);

    return ResponseEntity.ok(lesson);
  }

  @GetMapping
  public ResponseEntity<Page<LessonResponse>> fetchAllLesson(
      LessonQuery query) {
    Page<LessonResponse> lessons = lessonService.fetchAllLesson(query);

    return ResponseEntity.ok(lessons);
  }

  @PutMapping("/{id}")
  public ResponseEntity<LessonResponse> updateLesson(
      @PathVariable Long id,
      @RequestBody ReqUpdateLesson request) {
    LessonResponse lesson = lessonService.updateLesson(id, request);

    return ResponseEntity.ok(lesson);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<String> deleteLesson(
      @PathVariable Long id) {
    lessonService.deleteLesson(id);

    return ResponseEntity.ok("Xóa thành công");
  }

  @DeleteMapping("/course/{courseId}")
  public ResponseEntity<String> deleteByCourseId(
      @PathVariable Long courseId) {
    lessonService.deleteByCourseId(courseId);

    return ResponseEntity.ok("Xóa thành công !");
  }
}
