package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.mycompany.saas_japanese.util.constant.AdminJlptExamStatus;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminJlptExamDetailResponse {
  private Long id;
  private JlptLevelEnum level;
  private String title;
  private String description;
  private int totalTimeMinutes;
  private AdminJlptExamStatus status;
  private boolean hasAttempts;
  private boolean contentLocked;
  private Instant createdAt;
  private Instant updatedAt;
  private List<SessionResponse> sessions;

  @Getter
  @Builder
  public static class SessionResponse {
    private Long id;
    private String name;
    private JlptSessionEnum sessionType;
    private Integer timeLimitMinutes;
    private Integer sortOrder;
    private List<PartResponse> parts;
  }

  @Getter
  @Builder
  public static class PartResponse {
    private Long id;
    private String name;
    private String instructions;
    private Integer sortOrder;
    private MediaSummaryResponse audio;
    private List<QuestionResponse> questions;
  }

  @Getter
  @Builder
  public static class QuestionResponse {
    private Long id;
    private String questionText;
    private String passageText;
    private JlptQuestionEnum questionType;
    private String explanation;
    private BigDecimal points;
    private Integer sortOrder;
    private MediaSummaryResponse image;
    private List<AnswerResponse> answers;
  }

  @Getter
  @Builder
  public static class AnswerResponse {
    private Long id;
    private String answerText;
    private Boolean isCorrect;
    private Integer sortOrder;
  }

  @Getter
  @Builder
  public static class MediaSummaryResponse {
    private Long id;
    private String originalName;
    private String secureUrl;
    private FileTypeEnum fileType;
  }
}
