package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.Vocabulary;

public class VocabularySpecs {

  public static PredicateSpecification<Vocabulary> hasWord(
      String word) {

    return (root, builder) -> {

      if (word == null || word.trim().isEmpty()) {
        return null;
      }

      return builder.like(
          builder.lower(root.get("word")),
          "%" + word.trim().toLowerCase() + "%");
    };
  }

  public static PredicateSpecification<Vocabulary> hasReading(
      String reading) {

    return (root, builder) -> {

      if (reading == null || reading.trim().isEmpty()) {
        return null;
      }

      return builder.like(
          builder.lower(root.get("reading")),
          "%" + reading.trim().toLowerCase() + "%");
    };
  }

  public static PredicateSpecification<Vocabulary> hasMeaningVi(
      String meaningVi) {

    return (root, builder) -> {

      if (meaningVi == null || meaningVi.trim().isEmpty()) {
        return null;
      }

      return builder.like(
          builder.lower(root.get("meaningVi")),
          "%" + meaningVi.trim().toLowerCase() + "%");
    };
  }

  public static PredicateSpecification<Vocabulary> hasPartOfSpeech(
      String partOfSpeech) {

    return (root, builder) -> {

      if (partOfSpeech == null
          || partOfSpeech.trim().isEmpty()) {

        return null;
      }

      return builder.like(
          builder.lower(root.get("partOfSpeech")),
          "%" + partOfSpeech.trim().toLowerCase() + "%");
    };
  }

  public static PredicateSpecification<Vocabulary> hasLessonId(
      Long lessonId) {

    return (root, builder) -> {

      if (lessonId == null) {
        return null;
      }

      return builder.equal(
          root.get("lesson").get("id"),
          lessonId);
    };
  }

  public static PredicateSpecification<Vocabulary> isNotDeleted() {

    return (root, builder) -> builder.isNull(root.get("deletedAt"));
  }
}
