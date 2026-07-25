package com.mycompany.saas_japanese.domain.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class LessonVideoResponse {
    private Long id;
    private Long lessonId;
    private Long mediaId;
    private String videoUrl;
    private String title;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
