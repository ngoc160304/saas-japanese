package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseCategoryQuery extends BaseQuery {
  private String name;

    @Override
    @jakarta.validation.constraints.Min(1)
    public Integer getSize() {
        return super.getSize();
    }
}
