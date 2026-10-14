package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;

public record StudentLessonSummaryResponse(
    Long id, Long courseId, String title, String slug, Integer durationMinutes,
    Integer watchDuration, Integer videoDuration, BigDecimal progressPercent, Boolean isCompleted,
    Instant lastWatchedAt, Instant completedAt) {
}
