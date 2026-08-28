package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

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
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.LessonService;
import com.mycompany.saas_japanese.specification.LessonSpecs;
import com.mycompany.saas_japanese.util.SlugUtil;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Service
@Transactional
public class LessonServiceImpl implements LessonService {
        private final LessonRepository lessonRepository;
        private final CourseRepository courseRepository;
        private final MediaRepository mediaRepository;

        @Override
        public Lesson createLesson(
                        ReqCreateLesson request) {

                Course course = courseRepository
                                .findByIdAndIsDeletedFalse(request.getCourseId())
                                .orElseThrow(() -> new NotFoundException("Course không tồn tại"));

                Lesson lesson = new Lesson();

                lesson.setCourse(course);
                lesson.setTitle(request.getTitle().trim());

                lesson.setSlug(SlugUtil.toSlug(lesson.getTitle()));

                lesson.setGrammar(request.getGrammar());

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
                                        .orElseThrow(() -> new NotFoundException(
                                                        "Video Media không tồn tại"));

                        lesson.setVideoMedia(media);
                }

                return lessonRepository.save(lesson);
        }

        @Override
        public Lesson fetchLessonById(Long id) {

                Lesson lesson = lessonRepository
                                .findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException(
                                                "Lesson không tồn tại"));

                return lesson;
        }

        @Override
        public Page<Lesson> fetchAllLesson(
                        LessonQuery query) {

                PredicateSpecification<Lesson> spec = LessonSpecs.isNotDeleted();

                if (query.getTitle() != null &&
                                !query.getTitle().trim().isEmpty()) {

                        spec = spec.and(
                                        LessonSpecs.hasTitle(
                                                        query.getTitle()));
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

                return lessonPage;

        }

        @Override
        public Lesson updateLesson(Long id, ReqUpdateLesson request) {

                Lesson lesson = lessonRepository
                                .findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException(
                                                "Lesson không tồn tại"));

                lesson.setTitle(
                                request.getTitle().trim());

                lesson.setSlug(
                                request.getSlug().trim());

                lesson.setGrammar(request.getGrammar());

                lesson.setDurationMinutes(
                                request.getDurationMinutes());

                lesson.setIsPublished(
                                request.getIsPublished());

                Media media = mediaRepository
                                .findByIdAndIsDeletedFalse(
                                                request.getVideoMediaId())
                                .orElseThrow(() -> new NotFoundException(
                                                "Video Media không tồn tại"));

                lesson.setVideoMedia(media);

                Lesson updatedLesson = lessonRepository.save(lesson);

                return updatedLesson;
        }

        @Override
        public void deleteLesson(Long id) {

                Lesson lesson = lessonRepository
                                .findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException(
                                                "Lesson không tồn tại"));
                lesson.setIsDeleted(true);
                lesson.setDeletedAt(
                                java.time.Instant.now());

                lessonRepository.save(lesson);
        }

        @Override
        public void deleteByCourseId(long courseId) {
                // List<Lesson> lessons =
                // lessonRepository.findAllByCourseIdAndIsDeletedFalse(courseId);

                // for (Lesson lesson : lessons) {
                // lessonService.deleteLesson(lesson);
                // }

        }

        @Transactional
        public void deleteLesson(Lesson lesson) {

                // // Xóa/soft delete các content của lesson
                // grammarService.deleteByLessonId(lesson.getId());
                // vocabularyService.deleteByLessonId(lesson.getId());
                // kanjiService.deleteByLessonId(lesson.getId());
                // quizService.deleteByLessonId(lesson.getId());

                // // Xử lý video Media nếu cần
                // mediaService.deleteMedia(lesson.getVideoMedia());

                // lesson.setIsDeleted(true);
                // lesson.setDeletedAt(Instant.now());
        }

}
