package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.Course;

public class CourseSpecs {
    public static PredicateSpecification<Course> isNotDeleted() {
        return (root, builder) -> builder.isFalse(root.get("isDeleted"));
    }

    public static PredicateSpecification<Course> hasCategory(Long id) {
        return (root, builder) -> id == null ? null : builder.and(
            builder.equal(root.get("category").get("id"), id),
            builder.isFalse(root.get("category").get("isDeleted")));
    }

    public static PredicateSpecification<Course> hasPublished(Boolean published) {
        return (root, builder) -> published == null ? null : builder.equal(root.get("isPublished"), published);
    }

    public static PredicateSpecification<Course> hasPricing(String pricing) {
        return (root, builder) -> pricing == null ? null : "free".equals(pricing)
            ? builder.equal(root.get("price"), java.math.BigDecimal.ZERO)
            : builder.greaterThan(root.get("price"), java.math.BigDecimal.ZERO);
    }


    public static PredicateSpecification<Course> hasTitle(String title) {

        return (root, builder) -> {

            if (title == null || title.trim().isEmpty()) {
                return null;
            }

            return builder.like(
                    builder.lower(root.get("title")),
                    "%" + title.trim().toLowerCase() + "%");
        };
    }

    public static PredicateSpecification<Course> hasSearch(String search) {

        if (search == null || search.isBlank()) {
            return (root, builder) -> null;
        }

        String keyword = "%" + search.trim().toLowerCase() + "%";

        return (root, builder) -> builder.or(
                builder.like(
                        builder.lower(root.get("title")),
                        keyword),
                builder.like(
                        builder.lower(root.get("description")),
                        keyword),
                builder.like(
                        builder.lower(root.get("slug")),
                        keyword));
    }

}
