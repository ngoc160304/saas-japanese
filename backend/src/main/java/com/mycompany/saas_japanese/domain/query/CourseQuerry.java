package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseQuerry extends BaseQuery {
    private String title;
    @jakarta.validation.constraints.Positive
    private Long categoryId;
    private Boolean published;
    @jakarta.validation.constraints.Pattern(regexp = "free|paid")
    private String pricing;
    @Override
    @jakarta.validation.constraints.Min(1)
    public Integer getSize() {
        return super.getSize();
    }
}
