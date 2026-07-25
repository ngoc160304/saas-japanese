package com.mycompany.saas_japanese.domain.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class VocabularyResponse {
    private Long id;
    private Long lessonId;
    private Long mediaId;
    private String term;
    private String kanji;
    private String meaning;
    private String romaji;
    private String exampleSentence;
    private String exampleMeaning;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
