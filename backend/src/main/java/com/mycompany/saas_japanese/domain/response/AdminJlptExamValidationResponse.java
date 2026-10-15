package com.mycompany.saas_japanese.domain.response;

import java.util.List;
import java.util.Map;

import com.mycompany.saas_japanese.util.constant.AdminJlptExamStatus;

public record AdminJlptExamValidationResponse(
    Long examId, AdminJlptExamStatus status, boolean contentValid, boolean canPublish,
    boolean hasAttempts, boolean contentLocked, long totalTimeMinutes, List<Issue> issues) {

  public AdminJlptExamValidationResponse {
    issues = List.copyOf(issues);
  }

  public enum Category { CONTENT, LIFECYCLE }

  public record Issue(
      String code, String message, String path, Category category, Map<String, Long> resourceIds)
      implements java.io.Serializable {
    public Issue {
      resourceIds = Map.copyOf(resourceIds);
    }
  }
}
