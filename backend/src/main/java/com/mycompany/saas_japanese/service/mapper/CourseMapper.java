package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.response.CourseResponse;

@Component
public class CourseMapper {
    public CourseResponse toResponse(Course course) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setTitle(course.getTitle());
        response.setSlug(course.getSlug());
        response.setDescription(course.getDescription());
        response.setPublished(course.getIsPublished());
        response.setPrice(course.getPrice());
        response.setThumnailURL(null);
        return response;
    }
}
