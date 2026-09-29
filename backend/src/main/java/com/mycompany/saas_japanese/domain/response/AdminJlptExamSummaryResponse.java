package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;

import com.mycompany.saas_japanese.util.constant.AdminJlptExamStatus;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminJlptExamSummaryResponse {
  private Long id;
  private JlptLevelEnum level;
  private String title;
  private String description;
  private int totalTimeMinutes;
  private AdminJlptExamStatus status;
  private boolean hasAttempts;
  private Instant createdAt;
  private Instant updatedAt;
}
