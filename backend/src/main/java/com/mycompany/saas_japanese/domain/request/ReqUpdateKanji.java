package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateKanji {
    private Long lessonId;

    @NotBlank(message = "Kanji is required")
    private String kanji;

    private String onyomi;
    private String kunyomi;

    @NotBlank(message = "Meaning is required")
    private String meaningVi;

    private Integer strokeCount;
    private String exampleWords;
}
