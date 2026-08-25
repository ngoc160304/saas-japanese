package com.mycompany.saas_japanese.domain.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateCourse {
    @NotBlank(message = "Title Không được để trống")
    private String title;

    @NotBlank(message = "description Không được để trống")
    private String description;

    @NotNull(message = "thumbnailId không được để trống")
    private Long thumbnailId;

    @NotNull(message = "isPublished không được để trống")
    private Boolean isPublished;

    @NotNull(message = "Price không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price không được nhỏ hơn 0")
    private BigDecimal price;
}
