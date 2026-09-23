package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqSaveJlptAnswer {

    
    @NotNull
    private Long questionId;

    @NotNull
    private Long answerId;
}
