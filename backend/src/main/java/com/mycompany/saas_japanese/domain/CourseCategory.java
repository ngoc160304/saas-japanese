package com.mycompany.saas_japanese.domain;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(nullable = false, length = 220)
  private String slug;

  @Column(columnDefinition = "TEXT")
  private String description;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "media_id")
  private Media media;

  @Column(nullable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  private Instant deletedAt;

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
