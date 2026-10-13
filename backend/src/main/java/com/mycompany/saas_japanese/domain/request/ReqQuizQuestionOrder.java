package com.mycompany.saas_japanese.domain.request;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReqQuizQuestionOrder(@NotNull List<@NotNull @Positive Long> questionIds) {
  public ReqQuizQuestionOrder {
    questionIds = questionIds == null ? null : Collections.unmodifiableList(new ArrayList<>(questionIds));
  }
}
