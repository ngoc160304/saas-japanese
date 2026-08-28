package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.Specification;

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
}
