package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonProgressResponse {

    private Long lessonId;

    private Integer watchDuration;

    private Integer videoDuration;

    private BigDecimal progressPercent;

    private Boolean isCompleted;

    private Instant lastWatchedAt;

    private Instant completedAt;

    private BigDecimal courseProgressPercent;
}