package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.Course;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class CourseController {

    private final CourseService courseService;

    CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // @GetMapping("/courses")
    @PostMapping("/courses")
    public Course createdNewCourses(@RequestBody Course postManCourse) {
        Course course = this.courseService.handleCreateCourse(postManCourse);
        return course;
    }

    @DeleteMapping("/courses/{id}")
    public String deleteCourses(@PathVariable("id") long id) throws BadRequestException {
        if (id == 0) {
            throw new BadRequestException("Id khong ton tai");
        }
        this.courseService.deleteByIdCourse(id);
        return "done";
    }

    @GetMapping("/courses/{id}")
    public Course fetchCoursesById(@PathVariable("id") long id) {
        return this.courseService.fetchCourseById(id);

    }

    @GetMapping("/courses")
    public List<Course> fetchAllCourses() {
        return this.courseService.fetchAllCourse();
    }

    @PutMapping("/courses")
    public Course updateCourses(@RequestBody Course postManCourse) {
        Course course = this.courseService.updateCourse(postManCourse);
        return course;
    }

}
