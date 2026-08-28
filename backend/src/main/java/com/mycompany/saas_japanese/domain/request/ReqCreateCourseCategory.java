package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateCourseCategory {

  @NotBlank(message = "Tên danh mục không được để trống")
  @Size(max = 200, message = "Tên danh mục không được vượt quá 200 ký tự")
  private String name;

  @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
  private String description;

  private Long mediaId;
}
