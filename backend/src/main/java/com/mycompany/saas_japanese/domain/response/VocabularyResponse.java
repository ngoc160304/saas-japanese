package com.mycompany.saas_japanese.domain.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabularyResponse {

  private Long id;

  private Long lessonId;

  private String word;

  private String reading;

  private String meaningVi;

  private String exampleSentenceJp;

  private String exampleSentenceVi;

  private String partOfSpeech;

  private Instant createdAt;

  private Instant updatedAt;
}
