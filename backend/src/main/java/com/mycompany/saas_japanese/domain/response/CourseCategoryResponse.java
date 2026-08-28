package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;

import lombok.*;

@Getter
@Setter
@Builder
public class CourseCategoryResponse {

  private Long id;

  private String name;

  private String slug;

  private String description;

  private Long mediaId;

  private String mediaUrl;

  private Instant createdAt;

  private Long courseCount;

  private Instant updatedAt;
}
