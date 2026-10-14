package com.mycompany.saas_japanese.domain.query;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VocabularyQuery extends BaseQuery {

  private String word;

  private String reading;

  private String meaningVi;

  private String partOfSpeech;

  @Positive
  private Long lessonId;

  @Override
  @Min(1)
  public Integer getSize() {
    return super.getSize();
  }

}
