package com.mycompany.saas_japanese.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.mycompany.saas_japanese.util.constant.JlptAttemptStatusEnum;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_jlpt_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserJlptAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jlpt_exam_id", nullable = false)
    private JlptExam jlptExam;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JlptAttemptStatusEnum status;

    @Builder.Default
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal totalScore = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isPassed = false;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant finishedAt;

    @Column(nullable = false)
    private Instant createdAt;

    private Integer durationSeconds;

    @OneToMany(
            mappedBy = "attempt",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<UserJlptAttemptSession> sessions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        createdAt = now;

        if (startedAt == null) {
            startedAt = now;
        }

        if (status == null) {
            status = JlptAttemptStatusEnum.IN_PROGRESS;
        }

        if (totalScore == null) {
            totalScore = BigDecimal.ZERO;
        }

        if (isPassed == null) {
            isPassed = false;
        }
    }
}