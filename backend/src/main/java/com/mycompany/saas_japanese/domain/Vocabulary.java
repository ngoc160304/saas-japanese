package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "vocabularies")
@Getter
@Setter
public class Vocabulary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lesson_id")
    private Long lessonId;

    @Column(nullable = false, length = 100)
    private String word;

    @Column(nullable = false, length = 150)
    private String reading;

    @Column(name = "meaning_vi", nullable = false, length = 500)
    private String meaningVi;

    @Column(name = "example_sentence_jp", columnDefinition = "TEXT")
    private String exampleSentenceJp;

    @Column(name = "example_sentence_vi", columnDefinition = "TEXT")
    private String exampleSentenceVi;

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}