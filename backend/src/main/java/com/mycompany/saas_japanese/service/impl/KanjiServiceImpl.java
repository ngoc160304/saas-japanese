package com.mycompany.saas_japanese.service.impl;

import java.util.Objects;

import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.query.KanjiQuery;
import com.mycompany.saas_japanese.domain.request.ReqKanji;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import com.mycompany.saas_japanese.repository.KanjiRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.service.KanjiService;
import com.mycompany.saas_japanese.service.mapper.KanjiMapper;
import com.mycompany.saas_japanese.specification.KanjiSpecs;

import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;
import com.mycompany.saas_japanese.util.error.ConflictException;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class KanjiServiceImpl implements KanjiService {

    private final KanjiRepository kanjiRepository;
    private final LessonRepository lessonRepository;
    private final KanjiMapper kanjiMapper;

    @Override
    @Transactional
    public KanjiResponse create(ReqKanji request) {

        if (kanjiRepository.existsByKanjiAndDeletedAtIsNull(
                request.getKanji().trim())) {
            throw new ConflictException(
                    "Kanji đã tồn tại: " + request.getKanji());
        }

        Kanji kanji = kanjiMapper.toEntity(request);

        if (request.getLessonId() != null) {
            Lesson lesson = lessonRepository
                    .findByIdAndIsDeletedFalseAndCourseIsDeletedFalse(request.getLessonId())
                    .orElseThrow(() -> new NotFoundException(
                            "Không tìm thấy lesson: "
                                    + request.getLessonId()));

            kanji.setLesson(lesson);
        }

        return kanjiMapper.toResponse(
                kanjiRepository.save(kanji));
    }

    @Override
    @Transactional(readOnly = true)
    public KanjiResponse findById(Long id, Long lessonId) {

        Kanji kanji = kanjiRepository
                .findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new NotFoundException(
                        "Không tìm thấy kanji: " + id));
        requireScope(kanji.getLesson(), lessonId);

        return kanjiMapper.toResponse(kanji);
    }

    @Transactional(readOnly = true)
    public Page<KanjiResponse> findAll(KanjiQuery query) {
        if (query.getLessonId() != null) {
            requireLesson(query.getLessonId());
        }

        PredicateSpecification<Kanji> spec = KanjiSpecs.isNotDeleted();

        spec = spec.and(
                KanjiSpecs.hasKanji(query.getKanji()));

        spec = spec.and(
                KanjiSpecs.hasMeaningVi(query.getMeaningVi()));

        spec = spec.and(
                KanjiSpecs.hasLessonId(query.getLessonId()));

        spec = spec.and(
                KanjiSpecs.hasSearch(query.getSearch()));
        PageRequest pageable = PageRequest.of(
                query.getPage(),
                query.getSize(),
                buildSort(query));

        return kanjiRepository.findBy(
                spec,
                q -> q.page(pageable)).map(kanjiMapper::toResponse);
    }

    @Override
    @Transactional
    public KanjiResponse update(
            Long id,
            ReqKanji request, Long lessonId) {

        Kanji kanji = kanjiRepository
                .findActiveForUpdate(id)
                .orElseThrow(() -> new NotFoundException(
                        "Không tìm thấy kanji: " + id));
        requireScope(kanji.getLesson(), lessonId);
        if (lessonId != null && !Objects.equals(lessonId, request.getLessonId())) {
            throw new BadRequestException("Cannot move content from the requested lesson");
        }

        if (request.getLessonId() != null) {
            Lesson lesson = lessonRepository
                    .findByIdAndIsDeletedFalseAndCourseIsDeletedFalse(request.getLessonId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson: " + request.getLessonId()));
            kanji.setLesson(lesson);
        } else {
            kanji.setLesson(null);
        }

        if (kanjiRepository.existsByKanjiAndIdNotAndDeletedAtIsNull(request.getKanji().trim(), id)) {
            throw new ConflictException("Kanji already exists");
        }
        kanjiMapper.updateEntity(kanji, request);

        return kanjiMapper.toResponse(
                kanjiRepository.save(kanji));
    }

    @Override
    @Transactional
    public void delete(Long id, Long lessonId) {

        Kanji kanji = kanjiRepository
                .findActiveForUpdate(id)
                .orElseThrow(() -> new NotFoundException(
                        "Không tìm thấy kanji: " + id));
        requireScope(kanji.getLesson(), lessonId);

        kanji.setDeletedAt(
                java.time.Instant.now());

        kanjiRepository.save(kanji);
    }

    private Sort buildSort(KanjiQuery query) {

        String sortKey = query.getSortKey();

        String field = switch (sortKey == null ? "" : sortKey) {
            case "id" -> "id";
            case "lessonId" -> "lesson.id";
            case "kanji" -> "kanji";
            case "onyomi" -> "onyomi";
            case "kunyomi" -> "kunyomi";
            case "meaningVi" -> "meaningVi";
            case "exampleWords" -> "exampleWords";
            case "createdAt" -> "createdAt";
            case "updatedAt" -> "updatedAt";
            case "strokeCount" -> "strokeCount";
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

    private void requireLesson(Long lessonId) {
        lessonRepository.findByIdAndIsDeletedFalseAndCourseIsDeletedFalse(lessonId)
            .orElseThrow(() -> new NotFoundException("Lesson not found"));
    }

    private void requireScope(Lesson parent, Long lessonId) {
        if (lessonId == null) {
            return;
        }
        requireLesson(lessonId);
        if (parent == null || !Objects.equals(parent.getId(), lessonId)) {
            throw new NotFoundException("Content not found in this lesson");
        }
    }

}
