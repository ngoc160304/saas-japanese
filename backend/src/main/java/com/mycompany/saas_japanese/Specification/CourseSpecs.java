package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.Course;

public class CourseSpecs {

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
