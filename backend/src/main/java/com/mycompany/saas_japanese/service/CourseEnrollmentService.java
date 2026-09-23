package com.mycompany.saas_japanese.service;



import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.query.CourseEnrollmentQuery;
import com.mycompany.saas_japanese.domain.response.CourseEnrollmentResponse;

public interface CourseEnrollmentService {

    CourseEnrollmentResponse enroll(Long userId,Long courseId);

    CourseEnrollmentResponse createEnrollmentAfterPayment(Long userId, Long courseId);

    Page<CourseEnrollmentResponse> getMyCourses(Long userId, CourseEnrollmentQuery query);
    
}
