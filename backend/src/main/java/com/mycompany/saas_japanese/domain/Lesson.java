package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "lessons")
@Getter
@Setter
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 220)
    private String slug;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "sort_order", nullable = false)
    private Long sortOrder = 0L;

    @Column(name = "is_published", nullable = false)
    private boolean isPublished = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "video_media_id")
    private Long videoMediaId;
}