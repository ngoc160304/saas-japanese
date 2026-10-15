package com.mycompany.saas_japanese.domain.query;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BaseQuery {

    @NotNull(message = "Page is required")
    @Min(value = 0, message = "page phai >= 0")
    private Integer page = 0;

    @NotNull(message = "Size is required")
    @Min(value = 1, message = "Size must be at least 1")
    @Max(value = 12, message = "size toi da bang 12")
    private Integer size = 10;

    private String search;
    private String sortKey;

    private String sortType = "DESC";
}
