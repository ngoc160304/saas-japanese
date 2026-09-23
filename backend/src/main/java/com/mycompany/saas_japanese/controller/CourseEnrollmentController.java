package com.mycompany.saas_japanese.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.query.CourseEnrollmentQuery;
import com.mycompany.saas_japanese.domain.response.CourseEnrollmentResponse;
import com.mycompany.saas_japanese.service.CourseEnrollmentService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;


import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;



@RestController 
@RequestMapping ("/courses")
@FieldDefaults (level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor 
public class CourseEnrollmentController {

    CourseEnrollmentService courseEnrollmentService;

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<CourseEnrollmentResponse> courseEnroll(
        @PathVariable("courseId") Long courseId) {

        return ResponseEntity.ok(courseEnrollmentService.enroll(courseId));

    }
    
    @GetMapping("/my-courses")
    public ResponseEntity<Page<CourseEnrollmentResponse>> getMyCourses(
        CourseEnrollmentQuery query){

        Page<CourseEnrollmentResponse> myCourses = courseEnrollmentService.getMyCourses(query);

        return ResponseEntity.ok(myCourses);
    }
    
}
