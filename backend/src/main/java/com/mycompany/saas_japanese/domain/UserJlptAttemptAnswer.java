package com.mycompany.saas_japanese.domain;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "user_jlpt_attempt_answers",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_session_attempt_question",
            columnNames = {"session_attempt_id", "jlpt_exam_question_id"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserJlptAttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_attempt_id", nullable = false)
    private UserJlptAttemptSession sessionAttempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jlpt_exam_question_id", nullable = false)
    private JlptExamQuestion jlptExamQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jlpt_exam_answer_id")
    private JlptExamAnswer jlptExamAnswer;

    @Column(nullable = false)
    private Boolean isCorrect;

    @Column(nullable = false)
    private Instant answeredAt;

    @PrePersist
    protected void onCreate() {
        if (answeredAt == null) {
            answeredAt = Instant.now();
        }

        if (isCorrect == null) {
            isCorrect = false;
        }
    }
}