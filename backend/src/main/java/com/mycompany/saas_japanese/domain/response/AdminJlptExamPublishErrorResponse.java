package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.mycompany.saas_japanese.domain.response.AdminJlptExamValidationResponse.Issue;

// Retains the standard error fields and adds the same typed issues as readiness inspection.
public record AdminJlptExamPublishErrorResponse(
    int status, String message, Map<String, String> fieldErrors, Instant timestamp, List<Issue> issues) {
  public AdminJlptExamPublishErrorResponse {
    fieldErrors = Map.copyOf(fieldErrors);
    issues = List.copyOf(issues);
  }
}
