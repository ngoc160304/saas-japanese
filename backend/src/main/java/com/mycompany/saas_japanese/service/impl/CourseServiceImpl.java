package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.service.mapper.CourseMapper;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.Specification.CourseSpecs;
import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.request.ReqCreateCourse;
import com.mycompany.saas_japanese.domain.request.ReqUpdateCourse;
import com.mycompany.saas_japanese.domain.response.CourseResponse;

@Service
public class CourseServiceImpl implements CourseService {
    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;

    CourseServiceImpl(CourseRepository courseRepository, CourseMapper courseMapper) {
        this.courseRepository = courseRepository;
        this.courseMapper = courseMapper;
    }

    @Override
    public Course handleCreateCourse(ReqCreateCourse requestCourse) {
        Course course = new Course();
        course.setTitle(requestCourse.getTitle());
        course.setDescription(requestCourse.getDescription());
        course.setLevel(null);
        course.setThumbnail(null);
        course.setSlug(requestCourse.getTitle().trim().toLowerCase().replace(" ", "-"));
        return this.courseRepository.save(course);
    }

    @Override
    public void deleteByIdCourse(long id) {
        if (!courseRepository.existsById(id)) {
            throw new BadRequestException("Id khong ton tai");
        }
        this.courseRepository.deleteById(id);
    }

    @Override
    public CourseResponse fetchCourseById(long id) {
        Optional<Course> courseOptional = this.courseRepository.findById(id);
        if (courseOptional.isPresent()) {
            return courseMapper.toResponse(courseOptional.get());
        } else {
            throw new BadRequestException("Id khong ton tai");
        }
    }

    @Override
    public Page<CourseResponse> fetchAllCourse(CourseQuerry query) {
        PredicateSpecification<Course> spec = (root, builder) -> null;

        if (query.getTitle() != null && !query.getTitle().trim().isEmpty()) {
            spec = spec.and(CourseSpecs.hasTitle(query.getTitle()));
        }

        if (query.getLevelId() != null) {
            spec = spec.and(CourseSpecs.hasLevelId(query.getLevelId()));
        }
        Page<Course> coursPage = courseRepository.findBy(spec,
                q -> q.page(PageRequest.of(query.getPage(), query.getSize(), Sort.by("id").ascending())));

        return coursPage.map(courseMapper::toResponse);
    }

    @Override
    public CourseResponse updateCourse(Long id, ReqUpdateCourse reqCourse) {
        Optional<Course> courseOptional = courseRepository.findById(id);
        if (courseOptional.isPresent()) {
            Course currentCourse = courseOptional.get();
            currentCourse.setTitle(reqCourse.getTitle());
            currentCourse.setDescription(reqCourse.getDescription());
            currentCourse.setPublished(reqCourse.getPublished());
            currentCourse.setLevel(null);
            currentCourse.setThumbnail(null);
            currentCourse.setSlug(reqCourse.getTitle().trim().toLowerCase().replace(" ", "-"));

            currentCourse = courseRepository.save(currentCourse);

            return courseMapper.toResponse(currentCourse);
        }
        throw new BadRequestException("Id khong ton tai");

    }

}
