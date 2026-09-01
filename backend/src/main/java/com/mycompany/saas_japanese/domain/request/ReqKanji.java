package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqKanji {

  @NotBlank(message = "Kanji không được để trống")
  @Size(max = 10, message = "Kanji không được vượt quá 10 ký tự")
  private String kanji;

  @Size(max = 150, message = "Onyomi không được vượt quá 150 ký tự")
  private String onyomi;

  @Size(max = 150, message = "Kunyomi không được vượt quá 150 ký tự")
  private String kunyomi;

  @NotBlank(message = "Nghĩa tiếng Việt không được để trống")
  @Size(max = 255, message = "Nghĩa tiếng Việt không được vượt quá 255 ký tự")
  private String meaningVi;

  @Min(value = 1, message = "Số nét phải lớn hơn 0")
  private Integer strokeCount;

  private String exampleWords;

  private Long lessonId;
}
