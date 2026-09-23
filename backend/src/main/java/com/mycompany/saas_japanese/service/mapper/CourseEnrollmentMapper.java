package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.CourseEnrollment;
import com.mycompany.saas_japanese.domain.response.CourseEnrollmentResponse;

@Component 
public class CourseEnrollmentMapper {
    public CourseEnrollmentResponse toResponse(CourseEnrollment enrollment){
        if(enrollment == null){
            return null;
        }
        CourseEnrollmentResponse response = new CourseEnrollmentResponse();

        response.setId(enrollment.getId());
        response.setProgressPercent(enrollment.getProgressPercent());
        response.setEnrollAt(enrollment.getEnrolledAt());
        response.setCompletedAt(enrollment.getCompletedAt());

        if(enrollment.getCourse() != null){

            response.setCourseId(
                enrollment.getCourse().getId()
            );

            response.setCourseTitle(
                enrollment.getCourse().getTitle()
            );
        }

        if(enrollment.getUser() != null){

            response.setUserId(
                enrollment.getUser().getId()
            );

        }

        return response;
    }
}
