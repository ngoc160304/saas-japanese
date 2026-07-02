package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import jakarta.validation.Valid;

import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.request.ReqCreateCourse;
import com.mycompany.saas_japanese.domain.request.ReqUpdateCourse;
import com.mycompany.saas_japanese.domain.response.CourseResponse;
import com.mycompany.saas_japanese.service.impl.CourseServiceImpl;
import com.mycompany.saas_japanese.service.mapper.CourseMapper;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class CourseController {

    private final JwtDecoder jwtDecoder;
    private final CourseServiceImpl courseServiceImpl;
    private final CourseMapper courseMapper;

    CourseController(CourseServiceImpl courseServiceImpl, JwtDecoder jwtDecoder, CourseMapper courseMapper) {
        this.courseServiceImpl = courseServiceImpl;
        this.jwtDecoder = jwtDecoder;
        this.courseMapper = courseMapper;
    }

    // @GetMapping("/courses")
    @PostMapping("/courses")
    public ResponseEntity<?> createdNewCourses(@Valid @RequestBody ReqCreateCourse requestCourse) {
        Course course = this.courseServiceImpl.handleCreateCourse(requestCourse);
        return ResponseEntity.status(HttpStatus.CREATED).body(courseMapper.toResponse(course));
    }

    @DeleteMapping("/courses/{id}")
    @ApiMessage("Delete course")
    public ResponseEntity<String> deleteCourses(@PathVariable("id") long id) {
        this.courseServiceImpl.deleteByIdCourse(id);
        return ResponseEntity.ok("Xoa thanh cong");
    }

    @GetMapping("/courses/{id}")
    @ApiMessage("fetch course by id")
    public ResponseEntity<CourseResponse> fetchCoursesById(@PathVariable("id") long id) {
        return ResponseEntity.ok(this.courseServiceImpl.fetchCourseById(id));
    }

    @GetMapping("/courses")
    @ApiMessage("fetch all course or filter ")
    public ResponseEntity<Page<CourseResponse>> fetchAllOrFiltered(@Valid CourseQuerry query) {
        return ResponseEntity.ok(this.courseServiceImpl.fetchAllCourse(query));
    }

    @PutMapping("/courses/{id}")
    @ApiMessage("Update course")
    public ResponseEntity<CourseResponse> updateCourses(@Valid @PathVariable("id") Long id,
            @RequestBody ReqUpdateCourse requestCourse) {
        CourseResponse response = this.courseServiceImpl.updateCourse(id, requestCourse);
        return ResponseEntity.ok(response);
    }

}
