package com.mycompany.saas_japanese.domain.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class KanjiResponse {
    private Long id;
    private Long lessonId;
    private String kanji;
    private String onyomi;
    private String kunyomi;
    private String meaningVi;
    private Integer strokeCount;
    private String exampleWords;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
