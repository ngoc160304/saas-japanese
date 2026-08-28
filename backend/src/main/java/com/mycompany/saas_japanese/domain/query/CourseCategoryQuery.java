package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseCategoryQuery {

  private String name;

  private int page = 0;

  private int size = 10;
}
