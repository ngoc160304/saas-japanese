package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_videos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "media_id")
    private Long mediaId;

    @Column(name = "video_url", length = 1000, nullable = false)
    private String videoUrl;

    @Column(name = "title", length = 255)
    private String title; // Mô tả ngắn (ví dụ: "Bài giảng chính", "Bài tập thực hành")

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
