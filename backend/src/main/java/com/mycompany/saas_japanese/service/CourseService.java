package com.mycompany.saas_japanese.service;

import java.util.List;

import com.mycompany.saas_japanese.domain.Course;

public interface CourseService {
    
    Course handleCreateCourse(Course course);

    void deleteByIdCourse(long id);

    Course fetchCourseById(long id);

    List<Course> fetchAllCourse();
    
    Course updateCourse(Course course);

    List<Course> filterCourse(String title);
}
