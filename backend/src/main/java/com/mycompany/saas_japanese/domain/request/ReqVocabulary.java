package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqVocabulary {

  private Long lessonId;

  @NotBlank(message = "Từ vựng không được để trống")
  @Size(max = 100, message = "Từ vựng không được vượt quá 100 ký tự")
  private String word;

  @NotBlank(message = "Cách đọc không được để trống")
  @Size(max = 150, message = "Cách đọc không được vượt quá 150 ký tự")
  private String reading;

  @NotBlank(message = "Nghĩa tiếng Việt không được để trống")
  @Size(max = 500, message = "Nghĩa tiếng Việt không được vượt quá 500 ký tự")
  private String meaningVi;

  private String exampleSentenceJp;

  private String exampleSentenceVi;

  @Size(max = 50, message = "Từ loại không được vượt quá 50 ký tự")
  private String partOfSpeech;
}
