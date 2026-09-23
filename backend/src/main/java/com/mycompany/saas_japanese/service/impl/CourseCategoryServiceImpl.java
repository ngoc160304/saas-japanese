package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;
import java.util.Objects;
import java.util.Map;
import java.util.stream.Collectors;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.ParentCount;

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
import com.mycompany.saas_japanese.util.error.BadRequestException;
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
  private final LessonRepository lessonRepository;

  @Override
  @Transactional
  public CourseCategoryResponse create(ReqCreateCourseCategory request) {

    String slug = uniqueSlug(request.getName(), 0L);

    Media media = null;

    if (request.getMediaId() != null) {

      media = mediaRepository
          .findByIdAndIsDeletedFalse(request.getMediaId())
          .orElseThrow(() -> new NotFoundException("Media không tồn tại"));

      if (media.getIsUsed()) {
        throw new BadRequestException("Media đã được sử dụng !");
      }
      media.setIsUsed(true);
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
      spec = spec.and(
          CourseCategorySpecs.hasSearch(
              query.getSearch()));
    PageRequest pageable = PageRequest.of(
        query.getPage(),
        query.getSize(),
        buildSort(query));

    Page<CourseCategory> categories = courseCategoryRepository.findAll(spec, pageable);
    Map<Long, Long> counts = categories.isEmpty() ? Map.of() : courseRepository
        .countByCategoryIds(categories.stream().map(CourseCategory::getId).toList()).stream()
        .collect(Collectors.toMap(ParentCount::getParentId, ParentCount::getTotal));
    return categories.map(category -> {
      CourseCategoryResponse response = courseCategoryMapper.toResponse(category);
      response.setCourseCount(counts.getOrDefault(category.getId(), 0L));
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

    CourseCategoryResponse response = courseCategoryMapper.toResponse(category);
    response.setCourseCount(courseRepository.countByCategoryIdAndIsDeletedFalse(id));
    response.setLessonCount(lessonRepository.countByCourseCategoryIdAndCourseIsDeletedFalseAndIsDeletedFalse(id));
    return response;
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

    String newSlug = uniqueSlug(request.getName(), id);

    category.setName(request.getName().trim());
    category.setSlug(newSlug);
    category.setDescription(request.getDescription());

    Media oldMedia = category.getMedia();
    Long oldMediaId = oldMedia == null ? null : oldMedia.getId();
    if (request.isMediaProvided() && !Objects.equals(oldMediaId, request.getMediaId())) {
      Media media = null;
      if (request.getMediaId() != null) {
        media = mediaRepository.findByIdAndIsDeletedFalse(request.getMediaId())
            .orElseThrow(() -> new NotFoundException("Media không tồn tại"));
        if (Boolean.TRUE.equals(media.getIsUsed())) {
          throw new BadRequestException("Media đã được sử dụng !");
        }
        media.setIsUsed(true);
      }
      if (oldMedia != null) {
        oldMedia.setIsUsed(false);
      }
      category.setMedia(media);
    }

    CourseCategory saved = courseCategoryRepository.save(category);

    return courseCategoryMapper.toResponse(saved);
  }

  @Override
  @Transactional
  public void delete(Long id) {

    CourseCategory category = courseCategoryRepository
        .findByIdAndIsDeletedFalse(id)
        .orElseThrow(() -> new NotFoundException(
            "Không tìm thấy danh mục khóa học"));

    if (courseRepository.existsByCategoryIdAndIsDeletedFalse(id)) {
      throw new BadRequestException("Không thể xóa danh mục đang có khóa học. Hãy chuyển hoặc xóa khóa học trước.");
    }
    if (category.getMedia() != null) {
      category.getMedia().setIsUsed(false);
    }
    category.setIsDeleted(true);
    category.setDeletedAt(Instant.now());

    courseCategoryRepository.save(category);
  }

    private String uniqueSlug(String name, Long id) {
      String base = SlugUtil.toSlug(name);
      String slug = base;
      int suffix = 2;
      while (courseCategoryRepository.existsBySlugAndIdNot(slug, id)) {
        slug = base + "-" + suffix++;
      }
      return slug;
    }

    private Sort buildSort(CourseCategoryQuery query) {

        String sortKey = query.getSortKey();

        String field = switch (sortKey == null ? "" : sortKey) {
            case "id" -> "id";
            case "name" -> "name";
            case "slug" -> "slug";
            case "description" -> "description";
            case "createdAt" -> "createdAt";
            case "updatedAt" -> "updatedAt";
            default -> "id";
        };

        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(query.getSortType());
        } catch (IllegalArgumentException e) {
            direction = Sort.Direction.DESC;
        }

        return Sort.by(direction, field);
    }


}
