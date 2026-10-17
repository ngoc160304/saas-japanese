package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.util.constant.AdminJlptExamStatus;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

public class JlptExamSpecs {
  public static PredicateSpecification<JlptExam> hasTitle(String title) {
    return (root, builder) -> {
      if (title == null || title.isBlank()) {
        return null;
      }
      return builder.like(builder.lower(root.get("title")), "%" + title.trim().toLowerCase() + "%");
    };
  }

  public static PredicateSpecification<JlptExam> hasJlptLevel(JlptLevelEnum jlptLevel) {
    return (root, builder) -> jlptLevel == null
        ? null
        : builder.equal(root.get("jlptLevel"), jlptLevel);
  }

  public static PredicateSpecification<JlptExam> hasSearch(String search) {
    return (root, builder) -> {
      if (search == null || search.isBlank()) {
        return null;
      }
      String keyword = "%" + search.trim().toLowerCase() + "%";
      return builder.or(
          builder.like(builder.lower(root.get("title")), keyword),
          builder.like(builder.lower(root.get("description")), keyword));
    };
  }

  public static PredicateSpecification<JlptExam> isPublishedAndActive() {
    return (root, builder) -> builder.and(
        builder.isFalse(root.get("isDeleted")),
        builder.isTrue(root.get("isPublished")));
  }

  public static PredicateSpecification<JlptExam> hasAdminStatus(AdminJlptExamStatus status) {
    return (root, builder) -> {
      if (status == AdminJlptExamStatus.ARCHIVED) {
        return builder.isTrue(root.get("isDeleted"));
      }
      if (status == AdminJlptExamStatus.PUBLISHED) {
        return builder.and(
            builder.isFalse(root.get("isDeleted")),
            builder.isTrue(root.get("isPublished")));
      }
      if (status == AdminJlptExamStatus.DRAFT) {
        return builder.and(
            builder.isFalse(root.get("isDeleted")),
            builder.isFalse(root.get("isPublished")));
      }
      return builder.isFalse(root.get("isDeleted"));
    };
  }
}
