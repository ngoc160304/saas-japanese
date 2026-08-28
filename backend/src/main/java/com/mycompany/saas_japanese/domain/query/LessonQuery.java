package com.mycompany.saas_japanese.domain.query;

import lombok.*;

@Getter
@Setter
public class LessonQuery extends BaseQuery {
  private Long courseId;

  private String title;
}
