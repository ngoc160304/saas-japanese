package com.mycompany.saas_japanese.domain;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "jlpt_exam_answer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JlptExamAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jlpt_exam_question_id", nullable = false)
    private JlptExamQuestion jlptExamQuestion;

    @Column(nullable = false, length = 500)
    private String answerText;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isCorrect = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
