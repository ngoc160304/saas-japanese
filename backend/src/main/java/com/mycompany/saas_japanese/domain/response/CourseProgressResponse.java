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
public class CourseProgressResponse {

    private Long courseId;

    private String courseTitle;

    private Long totalLessons;

    private Long completedLessons;

    private BigDecimal progressPercent;

    private Instant completedAt;
}
