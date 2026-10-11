package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqAttachLessonVideo {
  @NotNull(message = "Video media không được để trống")
  @Positive(message = "Video media ID phải lớn hơn 0")
  private Long videoMediaId;
}
