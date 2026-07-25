package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateVocabulary {
    private Long lessonId;

    @NotBlank(message = "Word is required")
    private String word;

    @NotBlank(message = "Reading is required")
    private String reading;

    @NotBlank(message = "Meaning is required")
    private String meaningVi;

    private String exampleSentenceJp;
    private String exampleSentenceVi;
    private String partOfSpeech;
}
