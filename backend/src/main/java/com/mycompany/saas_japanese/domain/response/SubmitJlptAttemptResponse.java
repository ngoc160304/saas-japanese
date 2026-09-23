package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.mycompany.saas_japanese.util.constant.JlptAttemptStatusEnum;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Singular;

@Getter
@Builder
public class SubmitJlptAttemptResponse {

    private Long attemptId;

    private JlptAttemptStatusEnum status;

    private BigDecimal totalScore;

    private BigDecimal maxScore;

    private Integer correctCount;

    private Integer totalQuestions;

    private Instant startedAt;

    private Instant finishedAt;

    private Integer durationSeconds;

    @Getter(AccessLevel.NONE)
    @Singular("session")
    private List<SessionResult> sessions;

    public List<SessionResult> getSessions() {
        return List.copyOf(sessions);
    }

    @Getter
    @Builder
    public static class SessionResult {

        private Long attemptSessionId;

        private Long sessionId;

        private String sessionName;

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
