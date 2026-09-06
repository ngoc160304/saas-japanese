package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KanjiQuery extends BaseQuery {

  private String kanji;

  private String meaningVi;

  private Long lessonId;

}
