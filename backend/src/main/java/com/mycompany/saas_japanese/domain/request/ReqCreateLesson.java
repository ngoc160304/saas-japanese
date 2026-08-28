package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateLesson {

  @NotNull(message = "Course không được để trống")
  private Long courseId;

  @NotBlank(message = "Title không được để trống")
  @Size(max = 200, message = "Title không được vượt quá 200 ký tự")
  private String title;

  private String grammar;

  @Min(value = 0, message = "Duration không được nhỏ hơn 0")
  private Integer durationMinutes;

  @Min(value = 0, message = "Sort order không được nhỏ hơn 0")
  private Integer sortOrder;

  private Boolean isPublished;

  private Long videoMediaId;
}
