package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VocabularyQuery extends BaseQuery {

  private String word;

  private String reading;

  private String meaningVi;

  private String partOfSpeech;

  private Long lessonId;

}
