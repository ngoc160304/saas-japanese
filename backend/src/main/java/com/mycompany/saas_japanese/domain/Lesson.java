package com.mycompany.saas_japanese.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "course_id", nullable = false)
  private Course course;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(nullable = false, length = 220)
  private String slug;

  @Column(columnDefinition = "LONGTEXT")
  private String grammar;

  @Column
  private Integer durationMinutes;

  @Builder.Default
  @Column(nullable = false)
  private Boolean isPublished = false;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "video_media_id")
  private Media videoMedia;

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

    if (isPublished == null) {
      isPublished = false;
    }

  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
