package com.mycompany.saas_japanese.domain.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class LessonResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String slug;
    private String content;
    private Integer durationMinutes;
    private Long sortOrder;
    private boolean isPublished;
    private String status;
    private List<LessonVideoResponse> videos; // Danh sách tất cả video của bài học
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
