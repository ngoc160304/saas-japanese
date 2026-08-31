package com.mycompany.saas_japanese.domain.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KanjiResponse {

  private Long id;

  private Long lessonId;

  private String kanji;

  private String onyomi;

  private String kunyomi;

  private String meaningVi;

  private Integer strokeCount;

  private String exampleWords;

  private Instant createdAt;

  private Instant updatedAt;
}
