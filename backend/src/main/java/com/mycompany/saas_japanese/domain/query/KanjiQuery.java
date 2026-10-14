package com.mycompany.saas_japanese.domain.query;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KanjiQuery extends BaseQuery {

  private String kanji;

  private String meaningVi;

  @Positive
  private Long lessonId;

  @Override
  @Min(1)
  public Integer getSize() {
    return super.getSize();
  }

}
