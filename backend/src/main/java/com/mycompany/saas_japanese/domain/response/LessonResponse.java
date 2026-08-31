package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResponse {

  private Long id;

  private Long courseId;

  private String title;

  private String slug;

  private String grammar;

  private Integer durationMinutes;

  private Boolean isPublished;

  private Boolean isDeleted;

  private Long videoMediaId;

  private String videoUrl;

  private Instant createdAt;

  private Instant updatedAt;
}
