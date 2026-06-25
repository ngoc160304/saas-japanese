package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.util.error.IdInvalidException;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.Course;

@Service
public class CourseServiceImpl implements CourseService {
    private final CourseRepository courseRepository;

    CourseServiceImpl(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Override
    public Course handleCreateCourse(Course course) {
        return this.courseRepository.save(course);
    }

    @Override
    public void deleteByIdCourse(long id) {
        if (!courseRepository.existsById(id)) {
            throw new IdInvalidException("Id khong ton tai");
        }
        this.courseRepository.deleteById(id);
    }

    @Override
    public Course fetchCourseById(long id) {
        Optional<Course> courseOptional = this.courseRepository.findById(id);
        if (courseOptional.isPresent()) {
            return courseOptional.get();
        }
        return null;
    }

    @Override
    public List<Course> fetchAllCourse() {
        return this.courseRepository.findAll();
    }

    @Override
    public Course updateCourse(Course reqCourse) {
        if (!courseRepository.existsById(reqCourse.getId())) {
            throw new IdInvalidException("Id khong ton tai");
        }
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

    @Override
    public List<Course> filterCourse(String title){
        if(title != null){
            return courseRepository.findByTitle(title);
        }
        return courseRepository.findAll();
    }

}


