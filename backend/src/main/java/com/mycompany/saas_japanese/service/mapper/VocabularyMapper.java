package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.domain.request.ReqVocabulary;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;

@Component
public class VocabularyMapper {

  public Vocabulary toEntity(ReqVocabulary request) {

    return Vocabulary.builder()
        .word(request.getWord())
        .reading(request.getReading())
        .meaningVi(request.getMeaningVi())
        .exampleSentenceJp(request.getExampleSentenceJp())
        .exampleSentenceVi(request.getExampleSentenceVi())
        .partOfSpeech(request.getPartOfSpeech())
        .build();
  }

  public void updateEntity(
      Vocabulary vocabulary,
      ReqVocabulary request) {

    vocabulary.setWord(request.getWord());
    vocabulary.setReading(request.getReading());
    vocabulary.setMeaningVi(request.getMeaningVi());
    vocabulary.setExampleSentenceJp(
        request.getExampleSentenceJp());
    vocabulary.setExampleSentenceVi(
        request.getExampleSentenceVi());
    vocabulary.setPartOfSpeech(
        request.getPartOfSpeech());
  }

  public VocabularyResponse toResponse(
      Vocabulary vocabulary) {

    return VocabularyResponse.builder()
        .id(vocabulary.getId())
        .lessonId(
            vocabulary.getLesson() != null
                ? vocabulary.getLesson().getId()
                : null)
        .word(vocabulary.getWord())
        .reading(vocabulary.getReading())
        .meaningVi(vocabulary.getMeaningVi())
        .exampleSentenceJp(
            vocabulary.getExampleSentenceJp())
        .exampleSentenceVi(
            vocabulary.getExampleSentenceVi())
        .partOfSpeech(
            vocabulary.getPartOfSpeech())
        .createdAt(vocabulary.getCreatedAt())
        .updatedAt(vocabulary.getUpdatedAt())
        .build();
  }
}
