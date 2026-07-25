package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateVocabulary {
    @NotNull(message = "Lesson ID is required")
    private Long lessonId;

    private Long mediaId;

    @NotBlank(message = "Term is required")
    private String term;

    private String kanji;

    @NotBlank(message = "Meaning is required")
    private String meaning;

    private String romaji;
    private String exampleSentence;
    private String exampleMeaning;
    private Integer sortOrder;
}
