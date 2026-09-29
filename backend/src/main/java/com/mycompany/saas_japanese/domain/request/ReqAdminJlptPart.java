package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqAdminJlptPart {
  @NotBlank(message = "Part name is required")
  @Size(max = 150, message = "Part name must not exceed 150 characters")
  private String name;

  @Size(max = 10000, message = "Instructions must not exceed 10000 characters")
  private String instructions;

  @PositiveOrZero(message = "Sort order must be zero or greater")
  private Integer sortOrder = 0;

  @Positive(message = "Audio media ID must be positive")
  private Long audioMediaId;
}
