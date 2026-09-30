package com.mycompany.saas_japanese.controller;

import java.util.List;

import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.response.ClientCourseResponse;
import com.mycompany.saas_japanese.domain.response.ClientCourseDetailResponse;
import com.mycompany.saas_japanese.domain.response.ClientLessonResponse;
import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/client/courses")
@RequiredArgsConstructor
public class ClientCourseController {

    private final CourseService courseService;

    @GetMapping
    @ApiMessage("fetch all client courses")
    public ResponseEntity<Page<ClientCourseResponse>> fetchAllClientCourses(
            @Valid CourseQuerry query) {

        return ResponseEntity.ok(
                courseService.fetchAllClientCourses(query)
        );
    }

    @GetMapping("/{id}")
    @ApiMessage("fetch client course detail")
    public ResponseEntity<ClientCourseDetailResponse> fetchClientCourseById(
            @PathVariable("id") Long id) {

        return ResponseEntity.ok(
                courseService.fetchClientCourseById(id)
        );
    }

    @GetMapping("/{courseId}/lessons")
    @ApiMessage("fetch client course lessons")
    public ResponseEntity<List<ClientLessonResponse>> fetchClientCourseLessons(
            @PathVariable("courseId") Long courseId) {
        return ResponseEntity.ok(courseService.fetchClientCourseLessons(courseId));
    }
}
