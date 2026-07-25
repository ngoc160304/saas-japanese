package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateLesson {
    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Slug is required")
    private String slug;

    private String content;
    
    private Integer durationMinutes;
    
    private Long sortOrder = 0L;
    
    private boolean isPublished = false;
}
