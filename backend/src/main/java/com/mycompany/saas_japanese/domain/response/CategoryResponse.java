package com.mycompany.saas_japanese.domain.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

  private Long id;

  private String name;

  private String slug;

  private String description;

  private Long mediaId;

  private String mediaUrl;

  private Boolean isDeleted;

  private Instant createdAt;

  private Instant updatedAt;
}
