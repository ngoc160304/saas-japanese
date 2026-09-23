package com.mycompany.saas_japanese.specification;



import org.springframework.data.jpa.domain.PredicateSpecification;

import com.mycompany.saas_japanese.domain.CourseEnrollment;

public class CourseEnrolmentSpecs {
    private CourseEnrolmentSpecs(){
    }

    public static PredicateSpecification<CourseEnrollment> hasUserId(Long userId){
        return (root, builder) -> builder.equal(
            root.get("user").get("id"),userId);
    }

    public static PredicateSpecification<CourseEnrollment> hasCourseTitle(String title) {
        return (root, builder) -> builder.like(
            builder.lower(root.get("course").get("title")),
            "%" + title.trim().toLowerCase() + "%");
  }
}
