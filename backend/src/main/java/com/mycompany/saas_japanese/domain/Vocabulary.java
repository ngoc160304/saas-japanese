package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "vocabularies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vocabulary {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "lesson_id")
  private Lesson lesson;

  @Column(nullable = false, length = 100)
  private String word;

  @Column(nullable = false, length = 150)
  private String reading;

  @Column(nullable = false, length = 500)
  private String meaningVi;

  @Lob
  private String exampleSentenceJp;

  @Lob
  private String exampleSentenceVi;

  @Column(length = 50)
  private String partOfSpeech;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  private Instant deletedAt;

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
