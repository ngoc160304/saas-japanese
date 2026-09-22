package com.mycompany.saas_japanese.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import lombok.*;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;
import jakarta.persistence.*;

@Entity
@Table(name = "jlpt_exam_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JlptExamSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Quan hệ nhiều - 1 với JlptExam
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jlpt_exam_id", nullable = false)
    private JlptExam jlptExam;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JlptSessionEnum sessionType;

    @Builder.Default
    @Column(nullable = false)
    private Integer timeLimitMinutes = 0;

    @OneToMany(mappedBy = "jlptExamSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<JlptExamPart> parts = new ArrayList<>();

    @Builder.Default
    @Column(nullable = false)
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

        if (timeLimitMinutes == null) {
            timeLimitMinutes = 0;
        }
        if (sortOrder == null) {
            sortOrder = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
