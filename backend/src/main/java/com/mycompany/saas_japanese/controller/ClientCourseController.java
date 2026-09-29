package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.response.ClientCourseResponse;
import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ClientCourseResponse> fetchClientCourseById(
            @PathVariable("id") Long id) {

        return ResponseEntity.ok(
                courseService.fetchClientCourseById(id)
        );
    }
}
