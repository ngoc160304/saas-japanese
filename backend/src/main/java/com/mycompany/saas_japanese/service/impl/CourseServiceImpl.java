package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.service.mapper.CourseMapper;
import com.mycompany.saas_japanese.util.SlugUtil;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.specification.CourseSpecs;
import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.request.ReqCreateCourse;
import com.mycompany.saas_japanese.domain.request.ReqUpdateCourse;
import com.mycompany.saas_japanese.domain.response.CourseResponse;

@Service
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {
    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final UploadServiceImpl uploadService;

    @Override
    @Transactional
    public Course handleCreateCourse(ReqCreateCourse requestCourse) {
        Media media = uploadService.getMediaById(requestCourse.getThumbnailId());
        if (media.getIsDeleted()) {
            throw new BadRequestException("Media has been deleted");
        }

        if (media.getIsUsed()) {
            throw new BadRequestException("Media is already in use");
        }

        Course course = new Course();

        course.setTitle(requestCourse.getTitle());
        course.setDescription(requestCourse.getDescription());
        course.setSlug(SlugUtil.toSlug(requestCourse.getTitle()));
        course.setIsPublished(requestCourse.getIsPublished());
        course.setPrice(requestCourse.getPrice());
        course.setThumbnailMedia(media);
        media.setIsUsed(true);

        return courseRepository.save(course);
    }

    @Override
    public void deleteByIdCourse(long id) {
        if (!courseRepository.existsById(id)) {
            throw new NotFoundException("Id khong ton tai");
        }
        this.courseRepository.deleteById(id);
    }

    @Override
    public CourseResponse fetchCourseById(long id) {
        Optional<Course> courseOptional = this.courseRepository.findById(id);
        if (courseOptional.isPresent()) {
            return courseMapper.toResponse(courseOptional.get());
        } else {
            throw new NotFoundException("Id khong ton tai");
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
            currentCourse.setIsPublished(reqCourse.getPublished());
            currentCourse.setThumbnailMedia(null);
            currentCourse.setSlug(reqCourse.getTitle().trim().toLowerCase().replace(" ", "-"));

            currentCourse = courseRepository.save(currentCourse);

            return courseMapper.toResponse(currentCourse);
        }
        throw new BadRequestException("Id khong ton tai");
    }

}
