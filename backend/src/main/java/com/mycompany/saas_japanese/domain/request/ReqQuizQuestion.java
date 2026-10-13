package com.mycompany.saas_japanese.domain.request;

import java.util.Collections;
import java.util.ArrayList;
import java.util.List;

import com.mycompany.saas_japanese.util.constant.QuizQuestionTypeEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ReqQuizQuestion(
    @NotBlank String questionText,
    @NotNull QuizQuestionTypeEnum questionType,
    @NotNull @Size(min = 2) List<@NotNull @Valid Option> options) {

  public ReqQuizQuestion {
    options = options == null ? null : Collections.unmodifiableList(new ArrayList<>(options));
  }

  public record Option(
      @Positive Long id,
      @NotBlank @Size(max = 500) String optionText,
      @NotNull Boolean isCorrect) {
  }
}
