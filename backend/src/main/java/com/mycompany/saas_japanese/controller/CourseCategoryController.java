package com.mycompany.saas_japanese.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.query.CourseCategoryQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateCourseCategory;
import com.mycompany.saas_japanese.domain.response.CourseCategoryResponse;
import com.mycompany.saas_japanese.service.CourseCategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/course-categories")
@RequiredArgsConstructor
public class CourseCategoryController {

  private final CourseCategoryService courseCategoryService;

  @PostMapping
  public ResponseEntity<CourseCategoryResponse> create(
      @Valid @RequestBody ReqCreateCourseCategory request) {

    return ResponseEntity.ok(courseCategoryService.create(request));
  }

  @GetMapping
  public ResponseEntity<Page<CourseCategoryResponse>> findAll(
      @Valid CourseCategoryQuery query) {

    return ResponseEntity.ok(
        courseCategoryService.findAll(query));
  }

  @GetMapping("/{id}")
  public ResponseEntity<CourseCategoryResponse> findById(
      @PathVariable("id") Long id) {

    return ResponseEntity.ok(courseCategoryService.findById(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<CourseCategoryResponse> update(
      @PathVariable("id") Long id,
      @Valid @RequestBody ReqCreateCourseCategory request) {

    return ResponseEntity.ok(
        courseCategoryService.update(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<String> delete(
      @PathVariable("id") Long id) {
    courseCategoryService.delete(id);
    return ResponseEntity.ok("Xóa thành công !");
  }
}
