package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateLessonPublication {
  @NotNull(message = "Trạng thái xuất bản không được thiếu")
  private Boolean isPublished;
}
