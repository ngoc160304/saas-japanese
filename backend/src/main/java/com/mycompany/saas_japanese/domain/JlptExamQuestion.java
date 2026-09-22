package com.mycompany.saas_japanese.domain;

import java.math.BigDecimal;
import java.time.Instant;

import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "jlpt_exam_question")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JlptExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jlpt_exam_part_id", nullable = false)
    private JlptExamPart jlptExamPart;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String passageText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JlptQuestionEnum questionType;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal points = BigDecimal.ONE;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column()
    private Long imageMediaId;

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
