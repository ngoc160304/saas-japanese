package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqAdminJlptAnswer {
  @NotBlank(message = "Answer text is required")
  @Size(max = 500, message = "Answer text must not exceed 500 characters")
  private String answerText;

  @NotNull(message = "Correctness is required")
  private Boolean isCorrect;

  @NotNull(message = "Sort order is required")
  @PositiveOrZero(message = "Sort order must be zero or greater")
  private Integer sortOrder;
}
