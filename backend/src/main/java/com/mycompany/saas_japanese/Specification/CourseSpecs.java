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

}
