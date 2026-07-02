package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "kanjis")
@Getter
@Setter
public class Kanji {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lesson_id")
    private Long lessonId;

    @Column(nullable = false, unique = true, length = 10)
    private String kanji;

    @Column(length = 150)
    private String onyomi;

    @Column(length = 150)
    private String kunyomi;

    @Column(name = "meaning_vi", nullable = false, length = 255)
    private String meaningVi;

    @Column(name = "stroke_count")
    private Integer strokeCount;

    @Column(name = "example_words", columnDefinition = "TEXT")
    private String exampleWords;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}