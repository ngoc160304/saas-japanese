package com.mycompany.saas_japanese.util.error;

import java.util.List;

import com.mycompany.saas_japanese.domain.response.AdminJlptExamValidationResponse.Issue;

public class JlptPublishValidationException extends BadRequestException {
  private final List<Issue> issues;

  public JlptPublishValidationException(List<Issue> issues) {
    super("JLPT exam is not ready for publication");
    this.issues = List.copyOf(issues);
  }

  public List<Issue> getIssues() {
    return issues;
  }
}
