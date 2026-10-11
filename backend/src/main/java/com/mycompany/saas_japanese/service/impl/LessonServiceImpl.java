package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.service.LessonService;
import com.mycompany.saas_japanese.service.mapper.LessonMapper;
import com.mycompany.saas_japanese.specification.LessonSpecs;
import com.mycompany.saas_japanese.util.SlugUtil;
import com.mycompany.saas_japanese.util.GrammarHtmlSanitizer;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;

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
        CourseCategoryRepository courseCategoryRepository;
        JlptExamPartRepository jlptExamPartRepository;
        JlptExamQuestionRepository jlptExamQuestionRepository;

        LessonMapper lessonMapper;
        GrammarHtmlSanitizer grammarHtmlSanitizer;

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
                                grammarHtmlSanitizer.sanitize(request.getGrammar()));

                lesson.setDurationMinutes(
                                request.getDurationMinutes());

                lesson.setIsPublished(
                                request.getIsPublished() != null
                                                ? request.getIsPublished()
                                                : false);

                lesson.setIsDeleted(false);

                if (request.getVideoMediaId() != null) {
                        lesson.setVideoMedia(claimVideo(request.getVideoMediaId()));
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

                spec = spec.and(
                                LessonSpecs.hasSearch(
                                                query.getSearch()));
                Page<Lesson> lessonPage = lessonRepository.findBy(
                                spec,
                                q -> q.page(
                                                PageRequest.of(
                                                                query.getPage(),
                                                                query.getSize(),
                                                                buildSort(query))));

                return lessonPage.map(
                                lessonMapper::toResponse);
        }

        @Override
        public LessonResponse updateLesson(
                        Long id,
                        ReqUpdateLesson request) {

                Lesson lesson = lessonRepository
                                .findActiveForUpdate(id)
                                .orElseThrow(
                                                () -> new NotFoundException(
                                                                "Lesson không tồn tại"));

                lesson.setTitle(
                                request.getTitle().trim());

                lesson.setSlug(
                                SlugUtil.toSlug(
                                                lesson.getTitle()));

                lesson.setGrammar(
                                grammarHtmlSanitizer.sanitize(request.getGrammar()));

                lesson.setDurationMinutes(
                                request.getDurationMinutes());

                lesson.setIsPublished(
                                request.getIsPublished());

                // A null videoMediaId in the established PUT contract means leave video unchanged.
                if (request.getVideoMediaId() != null) {
                        changeVideo(lesson, request.getVideoMediaId());
                }

                Lesson updatedLesson = lessonRepository.save(lesson);

                return lessonMapper.toResponse(
                                updatedLesson);
        }

        @Override
        public LessonResponse updateGrammar(Long id, String grammar) {
                Lesson lesson = activeLessonForUpdate(id);
                lesson.setGrammar(grammarHtmlSanitizer.sanitize(grammar));
                return lessonMapper.toResponse(lessonRepository.saveAndFlush(lesson));
        }

        @Override
        public LessonResponse updatePublication(Long id, boolean isPublished) {
                Lesson lesson = activeLessonForUpdate(id);
                lesson.setIsPublished(isPublished);
                return lessonMapper.toResponse(lessonRepository.saveAndFlush(lesson));
        }

        @Override
        public LessonResponse attachVideo(Long id, Long videoMediaId) {
                Lesson lesson = activeLessonForUpdate(id);
                changeVideo(lesson, videoMediaId);
                return lessonMapper.toResponse(lesson);
        }

        @Override
        public LessonResponse detachVideo(Long id) {
                Lesson lesson = activeLessonForUpdate(id);
                changeVideo(lesson, null);
                return lessonMapper.toResponse(lesson);
        }

        private Lesson activeLessonForUpdate(Long id) {
                return lessonRepository.findActiveForUpdate(id)
                                .orElseThrow(() -> new NotFoundException("Lesson không tồn tại"));
        }

        private Media claimVideo(Long mediaId) {
                Media media = mediaRepository.findActiveForUpdate(mediaId)
                                .orElseThrow(() -> new NotFoundException("Video Media không tồn tại"));
                if (media.getFileType() != FileTypeEnum.VIDEO) {
                        throw new BadRequestException("Tài nguyên không phải video");
                }
                if (Boolean.TRUE.equals(media.getIsUsed())
                                || lessonRepository.existsByVideoMediaIdAndIsDeletedFalse(mediaId)
                                || referencedOutsideLessons(mediaId)) {
                        throw new BadRequestException("Tài nguyên đã được sử dụng");
                }
                media.setIsUsed(true);
                return media;
        }

        private void changeVideo(Lesson lesson, Long mediaId) {
                Media old = lesson.getVideoMedia();
                if (Objects.equals(old == null ? null : old.getId(), mediaId)) {
                        return;
                }
                Media replacement = mediaId == null ? null : claimVideo(mediaId);
                lesson.setVideoMedia(replacement);
                lessonRepository.saveAndFlush(lesson);
                if (old != null) {
                        releaseIfUnreferenced(old);
                }
        }

        private void releaseIfUnreferenced(Media old) {
                Long mediaId = old.getId();
                if (!lessonRepository.existsByVideoMediaIdAndIsDeletedFalse(mediaId)
                                && !referencedOutsideLessons(mediaId)) {
                        old.setIsUsed(false);
                }
        }

        private boolean referencedOutsideLessons(Long mediaId) {
                return courseRepository.existsByThumbnailMediaIdAndIsDeletedFalse(mediaId)
                                || courseCategoryRepository.existsByMediaIdAndIsDeletedFalse(mediaId)
                                || jlptExamPartRepository.existsByAudioMediaId(mediaId)
                                || jlptExamQuestionRepository.existsByImageMediaId(mediaId);
        }

     

@Override
public void deleteLesson(Long id) {

        Lesson lesson = lessonRepository
                        .findActiveForUpdate(id)
                        .orElseThrow(
                                        () -> new NotFoundException(
                                                        "Lesson không tồn tại"));

        softDelete(lesson, Instant.now());
}

private void softDelete(Lesson lesson, Instant deletedAt) {

        lesson.setIsDeleted(true);

        lesson.setDeletedAt(deletedAt);

        Media old = lesson.getVideoMedia();
        lesson.setVideoMedia(null);
        lessonRepository.saveAndFlush(lesson);
        if (old != null) {
                releaseIfUnreferenced(old);
        }
}
    

        @Override
        public void deleteByCourseId(
                        long courseId) {

                // TODO:
                // Xử lý soft delete toàn bộ lesson
                // và các content liên quan của lesson.
        }

        private Sort buildSort(LessonQuery query) {

                String sortKey = query.getSortKey();

                String field = switch (sortKey == null ? "" : sortKey) {
                        case "id" -> "id";
                        case "courseId" -> "courseId";
                        case "title" -> "title";
                        case "slug" -> "slug";
                        case "grammar" -> "grammar";
                        case "durationMinutes" -> "durationMinutes";
                        case "isPublished" -> "isPublished";
                        case "createdAt" -> "createdAt";
                        case "updatedAt" -> "updatedAt";
                        default -> "id";
                };

                Sort.Direction direction;

                try {
                        direction = Sort.Direction.fromString(
                                        query.getSortType());
                } catch (IllegalArgumentException e) {
                        direction = Sort.Direction.DESC;
                }

                return Sort.by(direction, field);
        }
}
