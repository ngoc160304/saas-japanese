package com.mycompany.saas_japanese.domain.request;

import java.math.BigDecimal;

import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqAdminJlptQuestion {
  @NotBlank(message = "Question text is required")
  @Size(max = 20000, message = "Question text must not exceed 20000 characters")
  private String questionText;

  @Size(max = 50000, message = "Passage must not exceed 50000 characters")
  private String passageText;

  @NotNull(message = "Question type is required")
  private JlptQuestionEnum questionType;

  @Size(max = 20000, message = "Explanation must not exceed 20000 characters")
  private String explanation;

  @NotNull(message = "Points are required")
  @DecimalMin(value = "0.01", message = "Points must be greater than zero")
  @Digits(integer = 3, fraction = 2, message = "Points must fit DECIMAL(5,2)")
  private BigDecimal points;

  @NotNull(message = "Sort order is required")
  @PositiveOrZero(message = "Sort order must be zero or greater")
  private Integer sortOrder;

  @Positive(message = "Image media ID must be positive")
  private Long imageMediaId;
}
