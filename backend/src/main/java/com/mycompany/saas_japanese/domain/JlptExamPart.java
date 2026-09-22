package com.mycompany.saas_japanese.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "jlpt_exam_parts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JlptExamPart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jlpt_exam_session_id", nullable = false)
    private JlptExamSession jlptExamSession;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @OneToMany(mappedBy = "jlptExamPart", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<JlptExamQuestion> questions = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column()
    private Long audioMediaId;

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
