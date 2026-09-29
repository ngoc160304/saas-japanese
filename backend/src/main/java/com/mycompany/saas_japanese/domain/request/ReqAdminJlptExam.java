package com.mycompany.saas_japanese.domain.request;

import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqAdminJlptExam {
  @NotNull(message = "JLPT level is required")
  private JlptLevelEnum level;

  @NotBlank(message = "Title is required")
  @Size(max = 200, message = "Title must not exceed 200 characters")
  private String title;

  @Size(max = 500, message = "Description must not exceed 500 characters")
  private String description;
}
