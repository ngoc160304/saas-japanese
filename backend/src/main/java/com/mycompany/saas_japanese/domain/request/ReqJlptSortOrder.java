package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqJlptSortOrder {
  @NotNull(message = "Sort order is required")
  @PositiveOrZero(message = "Sort order must be zero or greater")
  private Integer sortOrder;
}
