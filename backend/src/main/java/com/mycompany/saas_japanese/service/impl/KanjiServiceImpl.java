package com.mycompany.saas_japanese.service.impl;

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

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.data.jpa.domain.Specification;
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
      throw new IllegalArgumentException(
          "Kanji đã tồn tại: " + request.getKanji());
    }

    Kanji kanji = kanjiMapper.toEntity(request);

    if (request.getLessonId() != null) {
      Lesson lesson = lessonRepository
          .findById(request.getLessonId())
          .orElseThrow(() -> new IllegalArgumentException(
              "Không tìm thấy lesson: "
                  + request.getLessonId()));

      kanji.setLesson(lesson);
    }

    return kanjiMapper.toResponse(
        kanjiRepository.save(kanji));
  }

  @Override
  @Transactional(readOnly = true)
  public KanjiResponse findById(Long id) {

    Kanji kanji = kanjiRepository
        .findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Không tìm thấy kanji: " + id));

    return kanjiMapper.toResponse(kanji);
  }

  @Transactional(readOnly = true)
  public Page<KanjiResponse> findAll(KanjiQuery query) {

    PredicateSpecification<Kanji> spec = KanjiSpecs.isNotDeleted();

    spec = spec.and(
        KanjiSpecs.hasKanji(query.getKanji()));

    spec = spec.and(
        KanjiSpecs.hasMeaningVi(query.getMeaningVi()));

    spec = spec.and(
        KanjiSpecs.hasLessonId(query.getLessonId()));

    PageRequest pageable = PageRequest.of(
        query.getPage(),
        query.getSize(),
        Sort.by(
            Sort.Direction.ASC,
            "id"));

    return kanjiRepository.findBy(
        spec,
        q -> q.page(pageable)).map(kanjiMapper::toResponse);
  }

  @Override
  @Transactional
  public KanjiResponse update(
      Long id,
      ReqKanji request) {

    Kanji kanji = kanjiRepository
        .findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Không tìm thấy kanji: " + id));

    kanjiMapper.updateEntity(
        kanji,
        request);

    Lesson lesson = lessonRepository
        .findById(request.getLessonId())
        .orElseThrow(() -> new IllegalArgumentException(
            "Không tìm thấy lesson: "
                + request.getLessonId()));

    kanji.setLesson(lesson);

    return kanjiMapper.toResponse(
        kanjiRepository.save(kanji));
  }

  @Override
  @Transactional
  public void delete(Long id) {

    Kanji kanji = kanjiRepository
        .findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Không tìm thấy kanji: " + id));

    kanji.setDeletedAt(
        java.time.Instant.now());

    kanjiRepository.save(kanji);
  }
}
