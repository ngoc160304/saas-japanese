package com.mycompany.saas_japanese.domain.request;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class ReqSaveAdminJlptQuestion extends ReqAdminJlptQuestion {
  @NotNull(message = "Complete answer set is required")
  @Size(min = 2, message = "At least two answers are required")
  private List<@NotNull @Valid AnswerInput> answers;

  public List<AnswerInput> getAnswers() {
    return answers == null ? null : new ArrayList<>(answers);
  }

  public void setAnswers(List<AnswerInput> answers) {
    this.answers = answers == null ? null : new ArrayList<>(answers);
  }

  public record AnswerInput(
      @Positive Long id,
      @NotBlank @Size(max = 500) String answerText,
      @NotNull Boolean isCorrect,
      @PositiveOrZero Integer sortOrder) {
  }
}
