package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StartJlptAttemptResponse {
     private Long attemptId;

    private Long examId;

    private String examTitle;

    private String mode;

    private Instant startedAt;

    private List<AttemptSessionResponse> sessions;

    @Getter
    @Builder
    public static class AttemptSessionResponse {

        private Long attemptSessionId;

        private Long sessionId;

        private String sessionTitle;

        private Integer sessionOrder;

        private List<AttemptPartResponse> parts;
    }

    @Getter
    @Builder
    public static class AttemptPartResponse {

        private Long attemptPartId;

        private Long partId;

        private String partName;

        private Integer partOrder;

        private List<QuestionResponse> questions;
    }

    @Getter
    @Builder
    public static class QuestionResponse {

        private Long questionId;

        private Integer questionOrder;

        private String questionText;

        private List<AnswerResponse> answers;
    }

    @Getter
    @Builder
    public static class AnswerResponse {

        private Long answerId;

        private String answerText;
    }
}
