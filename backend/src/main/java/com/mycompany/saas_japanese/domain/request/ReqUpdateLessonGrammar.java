package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateLessonGrammar {
  @NotNull(message = "Grammar không được thiếu; dùng chuỗi rỗng để xóa")
  private String grammar;
}
