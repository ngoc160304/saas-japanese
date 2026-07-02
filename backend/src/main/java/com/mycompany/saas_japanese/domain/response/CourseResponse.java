package com.mycompany.saas_japanese.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseResponse {
    private Long id;

    private String title;

    private String slug;

    private String description;

    private boolean published;

    private Long levelId;

    private Long thumbnailId;
}
