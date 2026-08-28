package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.query.CourseCategoryQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateCourseCategory;
import com.mycompany.saas_japanese.domain.response.CourseCategoryResponse;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.CourseCategoryService;
import com.mycompany.saas_japanese.service.mapper.CourseCategoryMapper;
import com.mycompany.saas_japanese.specification.CourseCategorySpecs;
import com.mycompany.saas_japanese.util.SlugUtil;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CourseCategoryServiceImpl implements CourseCategoryService {

  private final CourseCategoryRepository courseCategoryRepository;

  private final MediaRepository mediaRepository;

  private final CourseCategoryMapper courseCategoryMapper;

  private final CourseRepository courseRepository;

  @Override
  @Transactional
  public CourseCategoryResponse create(ReqCreateCourseCategory request) {

    String slug = SlugUtil.toSlug(request.getName());

    Media media = null;

    if (request.getMediaId() != null) {

      media = mediaRepository
          .findByIdAndIsDeletedFalse(request.getMediaId())
          .orElseThrow(() -> new NotFoundException("Media không tồn tại"));
    }

    CourseCategory category = CourseCategory.builder()
        .name(request.getName().trim())
        .slug(slug)
        .description(request.getDescription())
        .media(media)
        .isDeleted(false)
        .build();

    CourseCategory saved = courseCategoryRepository.save(category);

    return courseCategoryMapper.toResponse(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<CourseCategoryResponse> findAll(
      CourseCategoryQuery query) {

    Specification<CourseCategory> spec = CourseCategorySpecs.isNotDeleted();

    if (query.getName() != null
        && !query.getName().trim().isEmpty()) {

      spec = spec.and(
          CourseCategorySpecs.hasName(
              query.getName()));
    }

    PageRequest pageable = PageRequest.of(
        query.getPage(),
        query.getSize(),
        Sort.by("id").ascending());

    return courseCategoryRepository
        .findAll(spec, pageable)
        .map(category -> {

          CourseCategoryResponse response = courseCategoryMapper.toResponse(category);

          long courseCount = courseRepository
              .countByCategoryIdAndIsDeletedFalse(
                  category.getId());

          response.setCourseCount(courseCount);

          return response;
        });
  }

  @Override
  @Transactional(readOnly = true)
  public CourseCategoryResponse findById(Long id) {

    CourseCategory category = courseCategoryRepository
        .findByIdAndIsDeletedFalse(id)
        .orElseThrow(() -> new NotFoundException(
            "Không tìm thấy danh mục khóa học"));

    return courseCategoryMapper.toResponse(category);
  }

  @Override
  @Transactional
  public CourseCategoryResponse update(
      Long id,
      ReqCreateCourseCategory request) {

    CourseCategory category = courseCategoryRepository
        .findByIdAndIsDeletedFalse(id)
        .orElseThrow(() -> new NotFoundException(
            "Không tìm thấy danh mục khóa học"));

    String newSlug = SlugUtil.toSlug(request.getName());

    category.setName(request.getName().trim());
    category.setSlug(newSlug);
    category.setDescription(request.getDescription());

    if (request.getMediaId() != null) {

      Media media = mediaRepository
          .findByIdAndIsDeletedFalse(
              request.getMediaId())
          .orElseThrow(() -> new NotFoundException(
              "Media không tồn tại"));

      category.setMedia(media);

    } else {

      category.setMedia(null);
    }

    CourseCategory saved = courseCategoryRepository.save(category);

    return courseCategoryMapper.toResponse(saved);
  }

  @Override
  @Transactional
  public void delete(Long id) {

    CourseCategory category = courseCategoryRepository
        .findByIdAndIsDeletedFalse(id)
        .orElseThrow(() -> new RuntimeException(
            "Không tìm thấy danh mục khóa học"));

    category.setIsDeleted(true);
    category.setDeletedAt(Instant.now());

    courseCategoryRepository.save(category);
  }

}
