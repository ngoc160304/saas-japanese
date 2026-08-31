package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.domain.query.VocabularyQuery;
import com.mycompany.saas_japanese.domain.request.ReqVocabulary;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.VocabularyRepository;
import com.mycompany.saas_japanese.service.VocabularyService;
import com.mycompany.saas_japanese.service.mapper.VocabularyMapper;
import com.mycompany.saas_japanese.specification.VocabularySpecs;

@Service
@RequiredArgsConstructor
public class VocabularyServiceImpl implements VocabularyService {

  private final VocabularyRepository vocabularyRepository;

  private final LessonRepository lessonRepository;

  private final VocabularyMapper vocabularyMapper;

  @Override
  @Transactional
  public VocabularyResponse create(
      ReqVocabulary request) {

    Vocabulary vocabulary = vocabularyMapper.toEntity(request);

    if (request.getLessonId() != null) {

      Lesson lesson = lessonRepository
          .findById(request.getLessonId())
          .orElseThrow(() -> new IllegalArgumentException(
              "Không tìm thấy lesson: "
                  + request.getLessonId()));

      vocabulary.setLesson(lesson);
    }

    vocabulary = vocabularyRepository.save(
        vocabulary);

    return vocabularyMapper.toResponse(
        vocabulary);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<VocabularyResponse> findAll(
      VocabularyQuery query) {

    PredicateSpecification<Vocabulary> spec = (root, builder) -> null;

    spec = spec.and(
        VocabularySpecs.isNotDeleted());

    spec = spec.and(
        VocabularySpecs.hasWord(
            query.getWord()));

    spec = spec.and(
        VocabularySpecs.hasReading(
            query.getReading()));

    spec = spec.and(
        VocabularySpecs.hasMeaningVi(
            query.getMeaningVi()));

    spec = spec.and(
        VocabularySpecs.hasPartOfSpeech(
            query.getPartOfSpeech()));

    spec = spec.and(
        VocabularySpecs.hasLessonId(
            query.getLessonId()));

    PageRequest pageable = PageRequest.of(
        query.getPage(),
        query.getSize(),
        Sort.by("id").ascending());

    return vocabularyRepository.findBy(
        spec,
        q -> q.page(pageable)).map(vocabularyMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public VocabularyResponse findById(
      Long id) {

    Vocabulary vocabulary = vocabularyRepository
        .findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Không tìm thấy vocabulary: "
                + id));

    return vocabularyMapper.toResponse(
        vocabulary);
  }

  @Override
  @Transactional
  public VocabularyResponse update(
      Long id,
      ReqVocabulary request) {

    Vocabulary vocabulary = vocabularyRepository
        .findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Không tìm thấy vocabulary: "
                + id));

    vocabularyMapper.updateEntity(
        vocabulary,
        request);

    if (request.getLessonId() != null) {

      Lesson lesson = lessonRepository
          .findById(request.getLessonId())
          .orElseThrow(() -> new IllegalArgumentException(
              "Không tìm thấy lesson: "
                  + request.getLessonId()));

      vocabulary.setLesson(lesson);

    } else {

      vocabulary.setLesson(null);
    }

    vocabulary = vocabularyRepository.save(
        vocabulary);

    return vocabularyMapper.toResponse(
        vocabulary);
  }

  @Override
  @Transactional
  public void delete(Long id) {

    Vocabulary vocabulary = vocabularyRepository
        .findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Không tìm thấy vocabulary: "
                + id));

    vocabulary.setDeletedAt(
        Instant.now());

    vocabularyRepository.save(vocabulary);
  }
}
