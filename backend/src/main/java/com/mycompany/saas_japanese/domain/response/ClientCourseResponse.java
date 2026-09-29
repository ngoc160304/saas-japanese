package com.mycompany.saas_japanese.domain.response;


import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClientCourseResponse {

    private Long id;

    private String title;

    private String slug;

    private String description;

    private String categoryName;

    private Long lessonCount;

    private BigDecimal price;

    private String thumnailURL;
}
