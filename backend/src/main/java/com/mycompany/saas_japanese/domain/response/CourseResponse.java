package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.*;

@Getter
@Setter
public class CourseResponse {
    private Long id;

    private String title;

    private String slug;

    private String description;

    private boolean published;

    private String categoryName;

    private Long lessonCount;

    private BigDecimal price;

    private String thumnailURL;

    private Instant createdAt;
}
