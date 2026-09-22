package com.mycompany.saas_japanese.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.mycompany.saas_japanese.util.constant.JlptAttemptStatusEnum;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_jlpt_attempt_sessions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_attempt_session", columnNames = { "attempt_id", "jlpt_exam_session_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserJlptAttemptSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private UserJlptAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jlpt_exam_session_id", nullable = false)
    private JlptExamSession jlptExamSession;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JlptAttemptStatusEnum status;

    @Builder.Default
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal score = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isPassed = false;

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
    private Instant startedAt;

    private Instant finishedAt;

    private Integer durationSeconds;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "attemptSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserJlptAttemptPart> parts = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (startedAt == null) {
            startedAt = now;
        }

        if (status == null) {
            status = JlptAttemptStatusEnum.IN_PROGRESS;
        }

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

        if (isPassed == null) {
            isPassed = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}