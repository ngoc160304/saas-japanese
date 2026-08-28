package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.Lesson;

public class LessonSpecs {

  private LessonSpecs() {
  }

  public static PredicateSpecification<Lesson> hasTitle(String title) {

    return (root, builder) -> builder.like(
        builder.lower(root.get("title")),
        "%" + title.trim().toLowerCase() + "%");
  }

  public static PredicateSpecification<Lesson> hasCourseId(Long courseId) {

    return (root, builder) -> builder.equal(
        root.get("course").get("id"),
        courseId);
  }

  public static PredicateSpecification<Lesson> isNotDeleted() {

    return (root, builder) -> builder.equal(
        root.get("isDeleted"),
        false);
  }
}
