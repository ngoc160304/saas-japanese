package com.mycompany.saas_japanese.domain.query;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BaseQuery {

    @Min(value = 0, message = "page phai >= 0")
    private Integer page = 0;

    @Min(value = 0, message = "page phai >= 0")
    @Max(value = 10, message = "size toi da bang 10")
    private Integer size = 3;
}
