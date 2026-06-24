package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.repository.CourseRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.Course;

@Service
public class CourseService {
    private final CourseRepository courseRepository;

    CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public Course handleCreateCourse(Course course) {
        return this.courseRepository.save(course);
    }

    public void deleteByIdCourse(long id) {
         
        this.courseRepository.deleteById(id);
    }

    public Course fetchCourseById(long id) {
        Optional<Course> courseOptional = this.courseRepository.findById(id);
        if (courseOptional.isPresent()) {
            return courseOptional.get();
        }
        return null;
    }

    public List<Course> fetchAllCourse() {
        return this.courseRepository.findAll();
    }

    public Course updateCourse(Course reqCourse)  {
        Course currentCourse = this.fetchCourseById(reqCourse.getId());
        if (currentCourse != null) {
            currentCourse.setLevel(reqCourse.getLevel());
            currentCourse.setTitle(reqCourse.getTitle());
            currentCourse.setThumbnail(reqCourse.getThumbnail());
            currentCourse.setDescription(reqCourse.getDescription());
            currentCourse.setSlug(reqCourse.getSlug());
            currentCourse.setPublished(reqCourse.isPublished());
            currentCourse.setSortOrder(reqCourse.getSortOrder());
            currentCourse = this.courseRepository.save(currentCourse);
        } 
        return currentCourse;
    }

}
