package com.mycompany.saas_japanese.domain.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class VocabularyResponse {
    private Long id;
    private Long lessonId;
    private String word;
    private String reading;
    private String meaningVi;
    private String exampleSentenceJp;
    private String exampleSentenceVi;
    private String partOfSpeech;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
