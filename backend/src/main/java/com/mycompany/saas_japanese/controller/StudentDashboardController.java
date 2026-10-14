package com.mycompany.saas_japanese.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.mycompany.saas_japanese.domain.response.StudentDashboardResponse;
import com.mycompany.saas_japanese.service.StudentDashboardService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/student/dashboard")
public class StudentDashboardController {
  private final StudentDashboardService service;

  @GetMapping
  @ApiMessage("Fetch current student's course statistics")
  public ResponseEntity<StudentDashboardResponse> getCurrent() {
    return ResponseEntity.ok(service.getCurrent());
  }
}

