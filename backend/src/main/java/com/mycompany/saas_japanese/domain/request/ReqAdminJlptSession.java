package com.mycompany.saas_japanese.domain.request;

import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqAdminJlptSession {
  @NotBlank(message = "Session name is required")
  @Size(max = 150, message = "Session name must not exceed 150 characters")
  private String name;

  @NotNull(message = "Session type is required")
  private JlptSessionEnum sessionType;

  @NotNull(message = "Time limit is required")
  @Min(value = 1, message = "Time limit must be at least 1 minute")
  @Max(value = 180, message = "Time limit must not exceed 180 minutes")
  private Integer timeLimitMinutes;

  @NotNull(message = "Sort order is required")
  @PositiveOrZero(message = "Sort order must be zero or greater")
  private Integer sortOrder;
}
