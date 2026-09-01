package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.query.LessonQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateLesson;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLesson;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.LessonService;
import com.mycompany.saas_japanese.service.mapper.LessonMapper;
import com.mycompany.saas_japanese.specification.LessonSpecs;
import com.mycompany.saas_japanese.util.SlugUtil;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Service
@Transactional
public class LessonServiceImpl implements LessonService {

  LessonRepository lessonRepository;

  CourseRepository courseRepository;

  MediaRepository mediaRepository;

  LessonMapper lessonMapper;

  @Override
  public LessonResponse createLesson(
      ReqCreateLesson request) {

    Course course = courseRepository
        .findByIdAndIsDeletedFalse(
            request.getCourseId())
        .orElseThrow(
            () -> new NotFoundException(
                "Course không tồn tại"));

    Lesson lesson = new Lesson();

    lesson.setCourse(course);

    lesson.setTitle(
        request.getTitle().trim());

    lesson.setSlug(
        SlugUtil.toSlug(
            lesson.getTitle()));

    lesson.setGrammar(
        request.getGrammar());

    lesson.setDurationMinutes(
        request.getDurationMinutes());

    lesson.setIsPublished(
        request.getIsPublished() != null
            ? request.getIsPublished()
            : false);

    lesson.setIsDeleted(false);

    if (request.getVideoMediaId() != null) {

      Media media = mediaRepository
          .findByIdAndIsDeletedFalse(
              request.getVideoMediaId())
          .orElseThrow(
              () -> new NotFoundException(
                  "Video Media không tồn tại"));

      lesson.setVideoMedia(media);
    }

    Lesson savedLesson = lessonRepository.save(lesson);

    return lessonMapper.toResponse(
        savedLesson);
  }

  @Override
  @Transactional(Transactional.TxType.SUPPORTS)
  public LessonResponse fetchLessonById(
      Long id) {

    Lesson lesson = lessonRepository
        .findByIdAndIsDeletedFalse(id)
        .orElseThrow(
            () -> new NotFoundException(
                "Lesson không tồn tại"));

    return lessonMapper.toResponse(
        lesson);
  }

  @Override
  @Transactional(Transactional.TxType.SUPPORTS)
  public Page<LessonResponse> fetchAllLesson(
      LessonQuery query) {

    PredicateSpecification<Lesson> spec = LessonSpecs.isNotDeleted();

    if (query.getTitle() != null
        && !query.getTitle().trim().isEmpty()) {

      spec = spec.and(
          LessonSpecs.hasTitle(
              query.getTitle().trim()));
    }

    if (query.getCourseId() != null) {

      spec = spec.and(
          LessonSpecs.hasCourseId(
              query.getCourseId()));
    }

    Page<Lesson> lessonPage = lessonRepository.findBy(
        spec,
        q -> q.page(
            PageRequest.of(
                query.getPage(),
                query.getSize())));

    return lessonPage.map(
        lessonMapper::toResponse);
  }

  @Override
  public LessonResponse updateLesson(
      Long id,
      ReqUpdateLesson request) {

    Lesson lesson = lessonRepository
        .findByIdAndIsDeletedFalse(id)
        .orElseThrow(
            () -> new NotFoundException(
                "Lesson không tồn tại"));

    lesson.setTitle(
        request.getTitle().trim());

    lesson.setSlug(
        SlugUtil.toSlug(
            lesson.getTitle()));

    lesson.setGrammar(
        request.getGrammar());

    lesson.setDurationMinutes(
        request.getDurationMinutes());

    lesson.setIsPublished(
        request.getIsPublished());

    if (request.getVideoMediaId() != null && request.getVideoMediaId() != lesson.getVideoMedia().getId()) {

      Media media = mediaRepository
          .findByIdAndIsDeletedFalse(
              request.getVideoMediaId())
          .orElseThrow(
              () -> new NotFoundException(
                  "Video Media không tồn tại"));
      if (media.getIsUsed()) {
        throw new BadRequestException("Tài nguyên đã được sử dụng !");
      }
      lesson.setVideoMedia(media);
    }

    Lesson updatedLesson = lessonRepository.save(lesson);

    return lessonMapper.toResponse(
        updatedLesson);
  }

  @Override
  public void deleteLesson(
      Long id) {

    Lesson lesson = lessonRepository
        .findByIdAndIsDeletedFalse(id)
        .orElseThrow(
            () -> new NotFoundException(
                "Lesson không tồn tại"));

    lesson.setIsDeleted(true);

    lesson.setDeletedAt(
        Instant.now());

    lessonRepository.save(lesson);
  }

  @Override
  public void deleteByCourseId(
      long courseId) {

    // TODO:
    // Xử lý soft delete toàn bộ lesson
    // và các content liên quan của lesson.
  }
}
