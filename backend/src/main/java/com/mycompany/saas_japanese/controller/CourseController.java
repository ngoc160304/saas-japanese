package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.service.impl.CourseServiceImpl;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
public class CourseController {

    private final CourseServiceImpl courseService;

    CourseController(CourseServiceImpl courseService) {
        this.courseService = courseService;
    }

    // @GetMapping("/courses")
    @PostMapping("/courses")
    @ApiMessage("Create course")
    public ResponseEntity<Course> createdNewCourses(@RequestBody Course postManCourse) {
        Course course = this.courseService.handleCreateCourse(postManCourse);
        return ResponseEntity.status(HttpStatus.CREATED).body(course);
    }

    @DeleteMapping("/courses/{id}")
    @ApiMessage("Delete course")
    public ResponseEntity<String> deleteCourses(@PathVariable("id") long id) {
        this.courseService.deleteByIdCourse(id);
        return ResponseEntity.ok("Xoa thanh cong");
    }

    @GetMapping("/courses/{id}")
    @ApiMessage("fetch course by id")
    public ResponseEntity<Course> fetchCoursesById(@PathVariable("id") long id) {
        return ResponseEntity.ok(this.courseService.fetchCourseById(id));
    }

    @GetMapping("/courses")
    @ApiMessage("fetch all course")
    public ResponseEntity<List<Course>> fetchAllCourses() {
        return ResponseEntity.ok(this.courseService.fetchAllCourse());
    }

    @PutMapping("/courses")
    @ApiMessage("Update course")
    public ResponseEntity<Course> updateCourses(@RequestBody Course postManCourse) {
        Course course = this.courseService.updateCourse(postManCourse);
        return ResponseEntity.ok(course);
    }

    @GetMapping("/courses/filter")
    public List<Course> filterCourses(@RequestParam(value = "title", required = false) String title) {
        return courseService.filterCourse(title);
    }
}
