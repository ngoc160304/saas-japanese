package com.mycompany.saas_japanese.domain;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "user_jlpt_attempt_parts",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_attempt_session_part",
            columnNames = {"attempt_session_id", "jlpt_exam_part_id"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserJlptAttemptPart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_session_id", nullable = false)
    private UserJlptAttemptSession attemptSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jlpt_exam_part_id", nullable = false)
    private JlptExamPart jlptExamPart;

    @Builder.Default
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal score = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal maxScore = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private Integer correctCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer totalQuestions = 0;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (score == null) {
            score = BigDecimal.ZERO;
        }

        if (maxScore == null) {
            maxScore = BigDecimal.ZERO;
        }

        if (correctCount == null) {
            correctCount = 0;
        }

        if (totalQuestions == null) {
            totalQuestions = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}