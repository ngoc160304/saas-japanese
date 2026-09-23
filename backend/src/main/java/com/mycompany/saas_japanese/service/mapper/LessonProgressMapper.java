package com.mycompany.saas_japanese.service.mapper;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.LessonProgress;
import com.mycompany.saas_japanese.domain.response.LessonProgressResponse;

@Component
public class LessonProgressMapper {

    public LessonProgressResponse toResponse(
            LessonProgress progress,
            BigDecimal courseProgressPercent) {

        if (progress == null) {
            return null;
        }

        return LessonProgressResponse.builder()
                .lessonId(progress.getLesson().getId())
                .watchDuration(progress.getWatchDuration())
                .videoDuration(progress.getVideoDuration())
                .progressPercent(progress.getProgressPercent())
                .isCompleted(progress.getIsCompleted())
                .lastWatchedAt(progress.getLastWatchedAt())
                .completedAt(progress.getCompletedAt())
                .courseProgressPercent(courseProgressPercent)
                .build();
    }
}
