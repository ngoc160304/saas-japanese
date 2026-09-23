package com.mycompany.saas_japanese.specification;

import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

public class JlptExamSpecs {
    public static PredicateSpecification<JlptExam> hasTitle(String title) {

        return (root, builder) -> {

            if (title == null || title.trim().isEmpty()) {
                return null;
            }

            return builder.like(
                    builder.lower(root.get("title")),
                    "%" + title.trim().toLowerCase() + "%");
        };
    }

    public static PredicateSpecification<JlptExam> hasJlptLevel(JlptLevelEnum jlptLevel) {

        return (root, builder) -> {

            if (jlptLevel == null) {
                return null;
            }

            return builder.like(
                    builder.lower(root.get("jlptLevel")),
                    "%" + jlptLevel + "%");
        };
    }

    public static PredicateSpecification<JlptExam> hasSearch(String search) {

        return (root, builder) -> {

            if (search == null || search.trim().isEmpty()) {
                return null;
            }

            String keyword = "%" + search.trim().toLowerCase() + "%";

            return builder.or(
                    builder.like(
                            builder.lower(root.get("title")),
                            keyword),
                    builder.like(
                            builder.lower(root.get("description")),
                            keyword),
                    builder.like(root.get("jlptLevel").as(String.class),
                            keyword),
                    builder.like(root.get("totalTimeMinutes").as(String.class),
                            keyword));
        };
    }
}
