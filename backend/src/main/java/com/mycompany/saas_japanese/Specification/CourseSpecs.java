package com.mycompany.saas_japanese.Specification;

import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.Course;

public class CourseSpecs {
    public static PredicateSpecification<Course> hasTitle(String title) {
        return (root, builder) -> {
            if (title == null || title.trim().isEmpty())
                return null; // Nếu không truyền thì bỏ qua bộ lọc này
            return builder.like(builder.lower(root.get("title")), "%" + title.toLowerCase() + "%");
        };
    }

    public static PredicateSpecification<Course> hasLevelId(Long levelId) {
        return (root, builder) -> {
            if (levelId == null) {
                return null;
            }
            return builder.equal(
                    root.get("level").get("id"), levelId);
        };
    }
}
