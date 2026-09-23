package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mycompany.saas_japanese.util.constant.JlptAttemptStatusEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JlptAttemptHistoryResponse {

    private Long attemptId;

    private Long examId;

    private String examTitle;

    private JlptLevelEnum jlptLevel;

    private String mode;

    private JlptAttemptStatusEnum status;

    private BigDecimal totalScore;

    private BigDecimal maxScore;

    private Integer correctCount;

    private Integer totalQuestions;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean isPassed;

    private Instant startedAt;

    private Instant finishedAt;

    private Integer durationSeconds;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long sessionId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String sessionName;
}
