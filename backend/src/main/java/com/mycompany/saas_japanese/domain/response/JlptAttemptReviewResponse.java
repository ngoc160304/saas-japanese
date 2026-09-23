package com.mycompany.saas_japanese.domain.response;

import java.util.List;

import com.mycompany.saas_japanese.util.constant.JlptAttemptStatusEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Singular;

@Getter
@Builder
public class JlptAttemptReviewResponse {

    private Long attemptId;

    private Long examId;

    private String examTitle;

    private JlptLevelEnum jlptLevel;

    private JlptAttemptStatusEnum status;

    @Getter(AccessLevel.NONE)
    @Singular("session")
    private List<SessionReview> sessions;

    public List<SessionReview> getSessions() {
        return List.copyOf(sessions);
    }

    @Getter
    @Builder
    public static class SessionReview {

        private Long attemptSessionId;

        private Long sessionId;

        private String sessionName;

        private JlptSessionEnum sessionType;

        private Integer sessionOrder;

        @Getter(AccessLevel.NONE)
        @Singular("part")
        private List<PartReview> parts;

        public List<PartReview> getParts() {
            return List.copyOf(parts);
        }
    }

    @Getter
    @Builder
    public static class PartReview {

        private Long attemptPartId;

        private Long partId;

        private String partName;

        private Integer partOrder;

        @Getter(AccessLevel.NONE)
        @Singular("question")
        private List<QuestionReview> questions;

        public List<QuestionReview> getQuestions() {
            return List.copyOf(questions);
        }
    }

    @Getter
    @Builder
    public static class QuestionReview {

        private Long questionId;

        private Integer questionOrder;

        private String questionText;

        private String passageText;

        private Long selectedAnswerId;

        private Long correctAnswerId;

        private Boolean isCorrect;

        @Getter(AccessLevel.NONE)
        @Singular("answer")
        private List<AnswerReview> answers;

        private String explanation;

        public List<AnswerReview> getAnswers() {
            return List.copyOf(answers);
        }
    }

    @Getter
    @Builder
    public static class AnswerReview {

        private Long answerId;

        private String answerText;
    }
}
