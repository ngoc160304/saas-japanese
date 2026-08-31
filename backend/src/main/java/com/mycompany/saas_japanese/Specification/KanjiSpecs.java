package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.Kanji;

public class KanjiSpecs {

  public static PredicateSpecification<Kanji> hasKanji(String kanji) {

    return (root, builder) -> {

      if (kanji == null || kanji.trim().isEmpty()) {
        return null;
      }

      return builder.like(
          builder.lower(root.get("kanji")),
          "%" + kanji.trim().toLowerCase() + "%");
    };
  }

  public static PredicateSpecification<Kanji> hasMeaningVi(
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

  public static PredicateSpecification<Kanji> hasLessonId(
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

  public static PredicateSpecification<Kanji> isNotDeleted() {

    return (root, builder) -> builder.isNull(root.get("deletedAt"));
  }
}
