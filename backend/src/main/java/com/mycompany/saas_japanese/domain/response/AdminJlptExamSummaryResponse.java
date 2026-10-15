package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
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
  private boolean contentLocked;
  private long sessionCount;
  private long partCount;
  private long questionCount;
  private BigDecimal passingScore;
  private Instant createdAt;
  private Instant updatedAt;
}
