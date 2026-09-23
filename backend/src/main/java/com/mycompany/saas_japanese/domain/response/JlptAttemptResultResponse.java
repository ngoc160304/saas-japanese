package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mycompany.saas_japanese.util.constant.JlptAttemptStatusEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Singular;

@Getter
@Builder
public class JlptAttemptResultResponse {

    private Long attemptId;

    private Long examId;

    private String examTitle;

    private JlptLevelEnum jlptLevel;

    private JlptAttemptStatusEnum status;

    private String mode;

    private BigDecimal totalScore;

    private BigDecimal maxScore;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private BigDecimal overallPassScore;

    private Integer correctCount;

    private Integer totalQuestions;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean isPassed;

    private Instant startedAt;

    private Instant finishedAt;

    private Integer durationSeconds;

    @Getter(AccessLevel.NONE)
    @Singular("scoringSection")
    private List<ScoringSectionResult> scoringSections;

    @Getter(AccessLevel.NONE)
    @Singular("session")
    private List<SessionResult> sessions;

    public List<ScoringSectionResult> getScoringSections() {
        return List.copyOf(scoringSections);
    }

    public List<SessionResult> getSessions() {
        return List.copyOf(sessions);
    }

    @Getter
    @Builder
    public static class ScoringSectionResult {

        private String name;

        private BigDecimal score;

        private BigDecimal maxScore;

        private BigDecimal minimumPassScore;

        private Integer correctCount;

        private Integer totalQuestions;

        private Boolean isPassed;
    }

    @Getter
    @Builder
    public static class SessionResult {

        private Long attemptSessionId;

        private Long sessionId;

        private String sessionName;

        private JlptSessionEnum sessionType;

        private JlptAttemptStatusEnum status;

        private BigDecimal score;

        private BigDecimal maxScore;

        private Integer correctCount;

        private Integer totalQuestions;

        private Instant startedAt;

        private Instant finishedAt;

        private Integer durationSeconds;

        @Getter(AccessLevel.NONE)
        @Singular("part")
        private List<PartResult> parts;

        public List<PartResult> getParts() {
            return List.copyOf(parts);
        }
    }

    @Getter
    @Builder
    public static class PartResult {

        private Long attemptPartId;

        private Long partId;

        private String partName;

        private BigDecimal score;

        private BigDecimal maxScore;

        private Integer correctCount;

        private Integer totalQuestions;
    }
}
