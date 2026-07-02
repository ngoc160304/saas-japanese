package com.mycompany.saas_japanese.domain.query;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseQuerry extends BaseQuery{
    
    private String title;

    private Long levelId;
}
