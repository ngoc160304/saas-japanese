package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateLesson {

  private static final String MESSAGE_NOT_NULL = "Trường này không được để trống";

  @Size(max = 200, message = "Title không được vượt quá 200 ký tự")
  @NotBlank(message = MESSAGE_NOT_NULL)
  private String title;

  @NotNull(message = "Course không được để trống")
  @Positive
  private Long courseId;

  @Size(max = 220, message = MESSAGE_NOT_NULL)
  private String slug;

  private String grammar;

  @JsonIgnore
  private boolean grammarProvided;

  public void setGrammar(String grammar) {
    this.grammar = grammar;
    this.grammarProvided = true;
  }

  @Min(value = 0, message = "Duration không được nhỏ hơn 0")
  private Integer durationMinutes;

  @NotNull(message = MESSAGE_NOT_NULL)
  private Boolean isPublished;

  private Long videoMediaId;
}
