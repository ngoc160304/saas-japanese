package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.service.mapper.CourseMapper;
import com.mycompany.saas_japanese.util.SlugUtil;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

// import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.specification.CourseSpecs;
import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
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
    private final MediaRepository mediaRepository;
    private final CourseCategoryRepository courseCategoryRepository;
    private final LessonRepository lessonRepository;
    private final LessonServiceImpl lessonServiceImpl;

    @Override
    @Transactional
    public Course handleCreateCourse(ReqCreateCourse requestCourse) {
        CourseCategory courseCategory = courseCategoryRepository.findById(requestCourse.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found"));
        Course course = new Course();
        if (requestCourse.getThumbnailId() != null) {
            Media media = mediaRepository.findByIdAndIsDeletedFalse(requestCourse.getThumbnailId())
                    .orElseThrow(() -> new NotFoundException("File không tìm thấy !"));

            if (media.getIsUsed()) {
                throw new BadRequestException("Media is already in use");
            }
            course.setThumbnailMedia(media);
            media.setIsUsed(true);

        } else {
            course.setThumbnailMedia(null);
        }

        course.setTitle(requestCourse.getTitle());
        course.setCategory(courseCategory);
        course.setDescription(requestCourse.getDescription());
        course.setSlug(SlugUtil.toSlug(requestCourse.getTitle()));
        course.setIsPublished(requestCourse.getIsPublished());
        course.setPrice(requestCourse.getPrice());

        return courseRepository.save(course);
    }

    @Override
    public void deleteByIdCourse(long id) {
        Course course = courseRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Course không tồn tại"));

        // lessonServiceImpl.deleteByCourseId(id);

        course.setIsDeleted(true);
        course.setDeletedAt(Instant.now());
    }

    @Override
    public CourseResponse fetchCourseById(long id) {
        Optional<Course> courseOptional = this.courseRepository.findByIdAndIsDeletedFalse(id);
        if (courseOptional.isPresent()) {
            return courseMapper.toResponse(courseOptional.get());
        } else {
            throw new NotFoundException("Id khong ton tai");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseResponse> fetchAllCourse(CourseQuerry query) {

        PredicateSpecification<Course> spec = (root, builder) -> null;

        spec = spec.and(
                CourseSpecs.hasTitle(query.getTitle()));

        Page<Course> coursePage = courseRepository.findBy(
                spec,
                q -> q.page(
                        PageRequest.of(
                                query.getPage(),
                                query.getSize(),
                                Sort.by("id").ascending())));

        return coursePage.map(course -> {

            CourseResponse response = courseMapper.toResponse(course);

            response.setCategoryName(
                    course.getCategory() != null
                            ? course.getCategory().getName()
                            : null);

            long lessonCount = lessonRepository.countByCourseIdAndIsDeletedFalse(
                    course.getId());

            response.setLessonCount(lessonCount);

            return response;
        });
    }

    @Override
    public CourseResponse updateCourse(Long id, ReqUpdateCourse reqCourse) {
        Course currentCourse = courseRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new BadRequestException("Id không tồn tại"));

        currentCourse.setTitle(reqCourse.getTitle());
        currentCourse.setDescription(reqCourse.getDescription());
        currentCourse.setIsPublished(reqCourse.getPublished());
        String slug = SlugUtil.toSlug(reqCourse.getTitle());
        currentCourse.setSlug(slug);
        CourseCategory category = courseCategoryRepository.findByIdAndIsDeletedFalse(reqCourse.getCategoryId())
                .orElseThrow(() -> new BadRequestException("Category không tồn tại"));
        if (reqCourse.getThumbnailId() != null && reqCourse.getThumbnailId() != category.getMedia().getId()) {
            Media media = mediaRepository.findByIdAndIsDeletedFalse(reqCourse.getThumbnailId())
                    .orElseThrow(() -> new NotFoundException("File không tìm thấy !"));
            if (currentCourse.getThumbnailMedia().getId() != media.getId()) {
                if (media.getIsUsed()) {
                    throw new BadRequestException("Media is already in use");
                }
                currentCourse.setThumbnailMedia(media);
                media.setIsUsed(true);
            }

        }
        currentCourse.setCategory(category);
        Course updatedCourse = courseRepository.save(currentCourse);
        return courseMapper.toResponse(updatedCourse);
    }

}
