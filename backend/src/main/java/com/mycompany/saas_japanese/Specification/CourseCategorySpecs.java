package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.data.jpa.domain.Specification;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;

public class CourseCategorySpecs {
  private CourseCategorySpecs() {
  }

  public static Specification<CourseCategory> isNotDeleted() {
    return (root, query, criteriaBuilder) -> criteriaBuilder.isFalse(root.get("isDeleted"));
  }

  public static Specification<CourseCategory> hasName(String name) {
    return (root, query, criteriaBuilder) -> criteriaBuilder.like(
        criteriaBuilder.lower(root.get("name")),
        "%" + name.trim().toLowerCase() + "%");
  }

  public static PredicateSpecification<CourseCategory> hasSearch(String search) {

        if (search == null || search.isBlank()) {
            return (root, builder) -> null;
        }

        String keyword = "%" + search.trim().toLowerCase() + "%";

        return (root, builder) -> builder.or(
                builder.like(
                        builder.lower(root.get("name")),
                        keyword),
                builder.like(
                        builder.lower(root.get("slug")),
                        keyword),
                builder.like(
                        builder.lower(root.get("description")),
                        keyword));
    }
}
