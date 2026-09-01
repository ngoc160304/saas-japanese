package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KanjiQuery {

  private String kanji;

  private String meaningVi;

  private Long lessonId;

  private int page = 0;

  private int size = 10;
}
