package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateCourse {

    @NotBlank(message = "Title Không được để trống")
    private String title;

    @NotBlank(message = "description Không được để trống")
    private String description;

    private Boolean published;

    @NotNull(message = "Level không được để trống")
    private Long levelId;

    @NotNull(message = "thumbnailId không được để trống")
    private Long thumbnailId;
}
