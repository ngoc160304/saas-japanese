package com.mycompany.saas_japanese.service.mapper;

import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.domain.request.ReqKanji;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;

public class KanjiMapper {

  private KanjiMapper() {
  }

  public Kanji toEntity(ReqKanji request) {
    return Kanji.builder()
        .kanji(request.getKanji())
        .onyomi(request.getOnyomi())
        .kunyomi(request.getKunyomi())
        .meaningVi(request.getMeaningVi())
        .strokeCount(request.getStrokeCount())
        .exampleWords(request.getExampleWords())
        .build();
  }

  public void updateEntity(
      Kanji entity,
      ReqKanji request) {
    entity.setKanji(request.getKanji());
    entity.setOnyomi(request.getOnyomi());
    entity.setKunyomi(request.getKunyomi());
    entity.setMeaningVi(request.getMeaningVi());
    entity.setStrokeCount(request.getStrokeCount());
    entity.setExampleWords(request.getExampleWords());
  }

  public KanjiResponse toResponse(Kanji entity) {

    Long lessonId = entity.getLesson() != null
        ? entity.getLesson().getId()
        : null;

    return KanjiResponse.builder()
        .id(entity.getId())
        .lessonId(lessonId)
        .kanji(entity.getKanji())
        .onyomi(entity.getOnyomi())
        .kunyomi(entity.getKunyomi())
        .meaningVi(entity.getMeaningVi())
        .strokeCount(entity.getStrokeCount())
        .exampleWords(entity.getExampleWords())
        .createdAt(entity.getCreatedAt())
        .updatedAt(entity.getUpdatedAt())
        .build();
  }
}
