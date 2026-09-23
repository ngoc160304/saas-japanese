package com.mycompany.saas_japanese.domain;

import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import jakarta.persistence.*;

@Entity
@Table(name = "jlpt_exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JlptExam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JlptLevelEnum jlptLevel;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String description;

    @Builder.Default
    private int totalTimeMinutes = 0;

    @OneToMany(mappedBy = "jlptExam", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<JlptExamSession> sessions = new ArrayList<>();

    @Builder.Default
    @Column(nullable = false)
    private Boolean isPublished = false;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (isDeleted == null) {
            isDeleted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
