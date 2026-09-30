package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.response.ClientCourseDetailResponse;
import com.mycompany.saas_japanese.domain.response.ClientCourseResponse;
import com.mycompany.saas_japanese.domain.response.CourseResponse;

@Component
public class CourseMapper {
    public CourseResponse toResponse(Course course) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setCreatedAt(course.getCreatedAt());
        response.setTitle(course.getTitle());
        response.setSlug(course.getSlug());
        response.setDescription(course.getDescription());
        response.setPublished(course.getIsPublished());
        response.setPrice(course.getPrice());
        response.setThumnailURL(course.getThumbnailMedia() != null
                ? course.getThumbnailMedia().getSecureUrl()
                : null);
        return response;
    }

    public ClientCourseResponse toClientResponse(Course course) {
        ClientCourseResponse response = new ClientCourseResponse();
        mapClientFields(course, response);
        return response;
    }

    public ClientCourseDetailResponse toClientDetailResponse(Course course) {
        ClientCourseDetailResponse response = new ClientCourseDetailResponse();
        mapClientFields(course, response);
        response.setUpdatedAt(course.getUpdatedAt());
        return response;
    }

    private void mapClientFields(Course course, ClientCourseResponse response) {
        response.setId(course.getId());
        response.setTitle(course.getTitle());
        response.setSlug(course.getSlug());
        response.setDescription(course.getDescription());
        response.setPrice(course.getPrice());

        response.setCategoryName(
                course.getCategory() != null
                        ? course.getCategory().getName()
                        : null
        );

        response.setThumnailURL(
                course.getThumbnailMedia() != null
                        ? course.getThumbnailMedia().getSecureUrl()
                        : null
        );
    }
}
