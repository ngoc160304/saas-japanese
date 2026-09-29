package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.query.AdminJlptExamQuery;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptAnswer;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptExam;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptPart;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptQuestion;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptSession;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamSummaryResponse;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.service.AdminJlptExamService;
import com.mycompany.saas_japanese.service.mapper.AdminJlptExamMapper;
import com.mycompany.saas_japanese.specification.JlptExamSpecs;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.ConflictException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminJlptExamServiceImpl implements AdminJlptExamService {
  private final JlptExamRepository examRepository;
  private final JlptExamSessionRepository sessionRepository;
  private final JlptExamPartRepository partRepository;
  private final JlptExamQuestionRepository questionRepository;
  private final JlptExamAnswerRepository answerRepository;
  private final UserJlptAttemptRepository attemptRepository;
  private final MediaRepository mediaRepository;
  private final AdminJlptExamMapper mapper;

  @Override
  @Transactional(readOnly = true)
  public Page<AdminJlptExamSummaryResponse> findAll(AdminJlptExamQuery query) {
    PredicateSpecification<JlptExam> spec = (root, builder) -> null;
    spec = spec.and(JlptExamSpecs.hasSearch(query.getSearch()));
    spec = spec.and(JlptExamSpecs.hasJlptLevel(query.getLevel()));
    spec = spec.and(JlptExamSpecs.hasAdminStatus(query.getStatus()));

    PageRequest pageable = PageRequest.of(query.getPage(), query.getSize(), buildSort(query));
    Page<JlptExam> exams = examRepository.findBy(spec, fluent -> fluent.page(pageable));
    List<Long> examIds = exams.getContent().stream().map(JlptExam::getId).toList();
    Set<Long> attemptedExamIds = examIds.isEmpty()
        ? Collections.emptySet()
        : attemptRepository.findAttemptedExamIds(examIds);
    return exams.map(exam -> mapper.toSummary(exam, attemptedExamIds.contains(exam.getId())));
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamDetailResponse findById(Long examId) {
    JlptExam exam = requireExam(examId);
    return mapDetail(exam);
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse create(ReqAdminJlptExam request) {
    JlptExam exam = JlptExam.builder()
        .jlptLevel(request.getLevel())
        .title(request.getTitle().trim())
        .description(trimToNull(request.getDescription()))
        .totalTimeMinutes(0)
        .isPublished(false)
        .isDeleted(false)
        .build();
    return mapDetail(examRepository.save(exam));
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse update(Long examId, ReqAdminJlptExam request) {
    JlptExam exam = requireEditableExam(examId);
    exam.setJlptLevel(request.getLevel());
    exam.setTitle(request.getTitle().trim());
    exam.setDescription(trimToNull(request.getDescription()));
    return mapDetail(examRepository.save(exam));
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse publish(Long examId) {
    JlptExam exam = requireActiveExam(examId);
    validatePublishable(exam);
    exam.setIsPublished(true);
    return mapDetail(examRepository.save(exam));
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse unpublish(Long examId) {
    JlptExam exam = requireActiveExam(examId);
    exam.setIsPublished(false);
    return mapDetail(examRepository.save(exam));
  }

  @Override
  @Transactional
  public void delete(Long examId) {
    JlptExam exam = requireActiveExam(examId);
    exam.setIsPublished(false);
    exam.setIsDeleted(true);
    exam.setDeletedAt(Instant.now());
    examRepository.save(exam);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamDetailResponse.SessionResponse findSession(Long examId, Long sessionId) {
    requireSession(examId, sessionId);
    return sessionFromDetail(mapDetail(requireExam(examId)), sessionId);
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.SessionResponse createSession(
      Long examId, ReqAdminJlptSession request) {
    JlptExam exam = requireEditableExam(examId);
    JlptExamSession session = JlptExamSession.builder()
        .jlptExam(exam)
        .name(request.getName().trim())
        .sessionType(request.getSessionType())
        .timeLimitMinutes(request.getTimeLimitMinutes())
        .sortOrder(request.getSortOrder())
        .build();
    session = sessionRepository.save(session);
    recalculateTotalTime(exam);
    return findSession(examId, session.getId());
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.SessionResponse updateSession(
      Long examId, Long sessionId, ReqAdminJlptSession request) {
    JlptExam exam = requireEditableExam(examId);
    JlptExamSession session = requireSession(examId, sessionId);
    session.setName(request.getName().trim());
    session.setSessionType(request.getSessionType());
    session.setTimeLimitMinutes(request.getTimeLimitMinutes());
    session.setSortOrder(request.getSortOrder());
    sessionRepository.save(session);
    recalculateTotalTime(exam);
    return findSession(examId, sessionId);
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.SessionResponse updateSessionSortOrder(
      Long examId, Long sessionId, Integer sortOrder) {
    requireEditableExam(examId);
    JlptExamSession session = requireSession(examId, sessionId);
    session.setSortOrder(sortOrder);
    sessionRepository.save(session);
    return findSession(examId, sessionId);
  }

  @Override
  @Transactional
  public void deleteSession(Long examId, Long sessionId) {
    JlptExam exam = requireEditableExam(examId);
    JlptExamSession session = requireSession(examId, sessionId);
    releaseMediaForSession(sessionId);
    sessionRepository.delete(session);
    sessionRepository.flush();
    recalculateTotalTime(exam);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamDetailResponse.PartResponse findPart(
      Long examId, Long sessionId, Long partId) {
    requirePart(examId, sessionId, partId);
    return partFromDetail(mapDetail(requireExam(examId)), sessionId, partId);
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.PartResponse createPart(
      Long examId, Long sessionId, ReqAdminJlptPart request) {
    requireEditableExam(examId);
    JlptExamSession session = requireSession(examId, sessionId);
    Long audioMediaId = replaceMedia(null, request.getAudioMediaId(), FileTypeEnum.AUDIO);
    JlptExamPart part = JlptExamPart.builder()
        .jlptExamSession(session)
        .name(request.getName().trim())
        .instructions(trimToNull(request.getInstructions()))
        .sortOrder(request.getSortOrder())
        .audioMediaId(audioMediaId)
        .build();
    part = partRepository.save(part);
    return findPart(examId, sessionId, part.getId());
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.PartResponse updatePart(
      Long examId, Long sessionId, Long partId, ReqAdminJlptPart request) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    part.setName(request.getName().trim());
    part.setInstructions(trimToNull(request.getInstructions()));
    part.setSortOrder(request.getSortOrder());
    part.setAudioMediaId(replaceMedia(
        part.getAudioMediaId(), request.getAudioMediaId(), FileTypeEnum.AUDIO));
    partRepository.save(part);
    return findPart(examId, sessionId, partId);
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.PartResponse updatePartSortOrder(
      Long examId, Long sessionId, Long partId, Integer sortOrder) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    part.setSortOrder(sortOrder);
    partRepository.save(part);
    return findPart(examId, sessionId, partId);
  }

  @Override
  @Transactional
  public void deletePart(Long examId, Long sessionId, Long partId) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    releaseMediaForPart(part);
    partRepository.delete(part);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamDetailResponse.QuestionResponse findQuestion(
      Long examId, Long sessionId, Long partId, Long questionId) {
    requireQuestion(examId, sessionId, partId, questionId);
    return questionFromDetail(mapDetail(requireExam(examId)), sessionId, partId, questionId);
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.QuestionResponse createQuestion(
      Long examId, Long sessionId, Long partId, ReqAdminJlptQuestion request) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    Long imageMediaId = replaceMedia(null, request.getImageMediaId(), FileTypeEnum.IMAGE);
    JlptExamQuestion question = JlptExamQuestion.builder()
        .jlptExamPart(part)
        .questionText(request.getQuestionText().trim())
        .passageText(trimToNull(request.getPassageText()))
        .questionType(request.getQuestionType())
        .explanation(trimToNull(request.getExplanation()))
        .points(request.getPoints())
        .sortOrder(request.getSortOrder())
        .imageMediaId(imageMediaId)
        .build();
    question = questionRepository.save(question);
    return findQuestion(examId, sessionId, partId, question.getId());
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.QuestionResponse updateQuestion(
      Long examId, Long sessionId, Long partId, Long questionId,
      ReqAdminJlptQuestion request) {
    requireEditableExam(examId);
    JlptExamQuestion question = requireQuestion(examId, sessionId, partId, questionId);
    question.setQuestionText(request.getQuestionText().trim());
    question.setPassageText(trimToNull(request.getPassageText()));
    question.setQuestionType(request.getQuestionType());
    question.setExplanation(trimToNull(request.getExplanation()));
    question.setPoints(request.getPoints());
    question.setSortOrder(request.getSortOrder());
    question.setImageMediaId(replaceMedia(
        question.getImageMediaId(), request.getImageMediaId(), FileTypeEnum.IMAGE));
    questionRepository.save(question);
    return findQuestion(examId, sessionId, partId, questionId);
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.QuestionResponse updateQuestionSortOrder(
      Long examId, Long sessionId, Long partId, Long questionId, Integer sortOrder) {
    requireEditableExam(examId);
    JlptExamQuestion question = requireQuestion(examId, sessionId, partId, questionId);
    question.setSortOrder(sortOrder);
    questionRepository.save(question);
    return findQuestion(examId, sessionId, partId, questionId);
  }

  @Override
  @Transactional
  public void deleteQuestion(Long examId, Long sessionId, Long partId, Long questionId) {
    requireEditableExam(examId);
    JlptExamQuestion question = requireQuestion(examId, sessionId, partId, questionId);
    releaseMedia(question.getImageMediaId());
    answerRepository.deleteAll(
        answerRepository.findByJlptExamQuestionIdOrderBySortOrderAsc(questionId));
    answerRepository.flush();
    questionRepository.delete(question);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamDetailResponse.AnswerResponse findAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId) {
    JlptExamAnswer answer = requireAnswer(examId, sessionId, partId, questionId, answerId);
    return mapper.toAnswer(answer);
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.AnswerResponse createAnswer(
      Long examId, Long sessionId, Long partId, Long questionId,
      ReqAdminJlptAnswer request) {
    requireEditableExam(examId);
    JlptExamQuestion question = requireQuestion(examId, sessionId, partId, questionId);
    JlptExamAnswer answer = JlptExamAnswer.builder()
        .jlptExamQuestion(question)
        .answerText(request.getAnswerText().trim())
        .isCorrect(request.getIsCorrect())
        .sortOrder(request.getSortOrder())
        .build();
    return mapper.toAnswer(answerRepository.save(answer));
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.AnswerResponse updateAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId,
      ReqAdminJlptAnswer request) {
    requireEditableExam(examId);
    JlptExamAnswer answer = requireAnswer(examId, sessionId, partId, questionId, answerId);
    answer.setAnswerText(request.getAnswerText().trim());
    answer.setIsCorrect(request.getIsCorrect());
    answer.setSortOrder(request.getSortOrder());
    return mapper.toAnswer(answerRepository.save(answer));
  }

  @Override
  @Transactional
  public AdminJlptExamDetailResponse.AnswerResponse updateAnswerSortOrder(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId,
      Integer sortOrder) {
    requireEditableExam(examId);
    JlptExamAnswer answer = requireAnswer(examId, sessionId, partId, questionId, answerId);
    answer.setSortOrder(sortOrder);
    return mapper.toAnswer(answerRepository.save(answer));
  }

  @Override
  @Transactional
  public void deleteAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId) {
    requireEditableExam(examId);
    answerRepository.delete(requireAnswer(examId, sessionId, partId, questionId, answerId));
  }

  private AdminJlptExamDetailResponse mapDetail(JlptExam exam) {
    List<JlptExamSession> sessions = sessionRepository.findByJlptExam_IdOrderBySortOrderAsc(exam.getId());
    List<Long> sessionIds = sessions.stream().map(JlptExamSession::getId).toList();
    List<JlptExamPart> parts = sessionIds.isEmpty()
        ? List.of()
        : partRepository.findAdminPartsBySessionIds(sessionIds);
    List<Long> partIds = parts.stream().map(JlptExamPart::getId).toList();
    List<JlptExamQuestion> questions = partIds.isEmpty()
        ? List.of()
        : questionRepository.findAdminQuestionsByPartIds(partIds);
    List<Long> questionIds = questions.stream().map(JlptExamQuestion::getId).toList();
    List<JlptExamAnswer> answers = questionIds.isEmpty()
        ? List.of()
        : answerRepository.findAdminAnswersByQuestionIds(questionIds);

    Map<Long, List<JlptExamAnswer>> answersByQuestion = answers.stream()
        .collect(Collectors.groupingBy(answer -> answer.getJlptExamQuestion().getId()));
    Map<Long, Media> mediaById = loadMedia(parts, questions);

    Map<Long, List<AdminJlptExamDetailResponse.QuestionResponse>> questionsByPart = questions.stream()
        .map(question -> mapper.toQuestion(
            question,
            mediaById.get(question.getImageMediaId()),
            answersByQuestion.getOrDefault(question.getId(), List.of()).stream()
                .map(mapper::toAnswer)
                .toList()))
        .collect(Collectors.groupingBy(response -> requireQuestionPartId(questions, response.getId())));

    Map<Long, List<AdminJlptExamDetailResponse.PartResponse>> partsBySession = parts.stream()
        .map(part -> mapper.toPart(
            part,
            mediaById.get(part.getAudioMediaId()),
            questionsByPart.getOrDefault(part.getId(), List.of())))
        .collect(Collectors.groupingBy(response -> requirePartSessionId(parts, response.getId())));

    List<AdminJlptExamDetailResponse.SessionResponse> sessionResponses = sessions.stream()
        .map(session -> mapper.toSession(
            session,
            partsBySession.getOrDefault(session.getId(), List.of())))
        .toList();
    boolean hasAttempts = attemptRepository.existsByJlptExam_Id(exam.getId());
    return mapper.toDetail(exam, hasAttempts, sessionResponses);
  }

  private Map<Long, Media> loadMedia(
      Collection<JlptExamPart> parts,
      Collection<JlptExamQuestion> questions) {
    Set<Long> ids = new HashSet<>();
    parts.stream().map(JlptExamPart::getAudioMediaId).filter(Objects::nonNull).forEach(ids::add);
    questions.stream().map(JlptExamQuestion::getImageMediaId).filter(Objects::nonNull).forEach(ids::add);
    if (ids.isEmpty()) {
      return Map.of();
    }
    return mediaRepository.findAllById(ids).stream()
        .collect(Collectors.toMap(Media::getId, Function.identity()));
  }

  private Long requireQuestionPartId(List<JlptExamQuestion> questions, Long questionId) {
    return questions.stream()
        .filter(question -> Objects.equals(question.getId(), questionId))
        .findFirst()
        .orElseThrow()
        .getJlptExamPart()
        .getId();
  }

  private Long requirePartSessionId(List<JlptExamPart> parts, Long partId) {
    return parts.stream()
        .filter(part -> Objects.equals(part.getId(), partId))
        .findFirst()
        .orElseThrow()
        .getJlptExamSession()
        .getId();
  }

  private void validatePublishable(JlptExam exam) {
    AdminJlptExamDetailResponse detail = mapDetail(exam);
    if (detail.getSessions().isEmpty()) {
      throw new BadRequestException("A published exam must contain at least one session");
    }
    requireUniqueSortOrders(detail.getSessions().stream()
        .map(AdminJlptExamDetailResponse.SessionResponse::getSortOrder).toList(), "sessions");
    for (AdminJlptExamDetailResponse.SessionResponse session : detail.getSessions()) {
      if (session.getTimeLimitMinutes() == null || session.getTimeLimitMinutes() <= 0) {
        throw new BadRequestException("Every session must have a positive time limit");
      }
      if (session.getParts().isEmpty()) {
        throw new BadRequestException("Every session must contain at least one part");
      }
      requireUniqueSortOrders(session.getParts().stream()
          .map(AdminJlptExamDetailResponse.PartResponse::getSortOrder).toList(), "parts");
      for (AdminJlptExamDetailResponse.PartResponse part : session.getParts()) {
        if (part.getQuestions().isEmpty()) {
          throw new BadRequestException("Every part must contain at least one question");
        }
        requireUniqueSortOrders(part.getQuestions().stream()
            .map(AdminJlptExamDetailResponse.QuestionResponse::getSortOrder).toList(), "questions");
        for (AdminJlptExamDetailResponse.QuestionResponse question : part.getQuestions()) {
          validateQuestionForPublish(question);
        }
      }
    }
  }

  private void validateQuestionForPublish(AdminJlptExamDetailResponse.QuestionResponse question) {
    if (question.getQuestionType() != JlptQuestionEnum.single_choice) {
      throw new BadRequestException("Unsupported JLPT question type");
    }
    if (question.getAnswers().size() < 2) {
      throw new BadRequestException("Each single-choice question must have at least two answers");
    }
    long correctAnswers = question.getAnswers().stream()
        .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect()))
        .count();
    if (correctAnswers != 1) {
      throw new BadRequestException("Each single-choice question must have exactly one correct answer");
    }
    requireUniqueSortOrders(question.getAnswers().stream()
        .map(AdminJlptExamDetailResponse.AnswerResponse::getSortOrder).toList(), "answers");
  }

  private void requireUniqueSortOrders(List<Integer> sortOrders, String resource) {
    if (new HashSet<>(sortOrders).size() != sortOrders.size()) {
      throw new BadRequestException("Duplicate sort order in " + resource);
    }
  }

  private JlptExam requireExam(Long examId) {
    return examRepository.findById(examId)
        .orElseThrow(() -> new NotFoundException("JLPT exam not found"));
  }

  private JlptExam requireActiveExam(Long examId) {
    JlptExam exam = requireExam(examId);
    if (Boolean.TRUE.equals(exam.getIsDeleted())) {
      throw new NotFoundException("JLPT exam not found");
    }
    return exam;
  }

  private JlptExam requireEditableExam(Long examId) {
    JlptExam exam = requireActiveExam(examId);
    if (Boolean.TRUE.equals(exam.getIsPublished())) {
      throw new ConflictException("Unpublish the exam before editing its content");
    }
    if (attemptRepository.existsByJlptExam_Id(examId)) {
      throw new ConflictException("An exam with attempts is immutable; create a new revision instead");
    }
    return exam;
  }

  private JlptExamSession requireSession(Long examId, Long sessionId) {
    JlptExamSession session = sessionRepository.findById(sessionId)
        .orElseThrow(() -> new NotFoundException("JLPT exam session not found"));
    if (!Objects.equals(session.getJlptExam().getId(), examId)) {
      throw new NotFoundException("JLPT exam session not found in this exam");
    }
    return session;
  }

  private JlptExamPart requirePart(Long examId, Long sessionId, Long partId) {
    requireSession(examId, sessionId);
    JlptExamPart part = partRepository.findById(partId)
        .orElseThrow(() -> new NotFoundException("JLPT exam part not found"));
    if (!Objects.equals(part.getJlptExamSession().getId(), sessionId)) {
      throw new NotFoundException("JLPT exam part not found in this session");
    }
    return part;
  }

  private JlptExamQuestion requireQuestion(
      Long examId, Long sessionId, Long partId, Long questionId) {
    requirePart(examId, sessionId, partId);
    JlptExamQuestion question = questionRepository.findById(questionId)
        .orElseThrow(() -> new NotFoundException("JLPT exam question not found"));
    if (!Objects.equals(question.getJlptExamPart().getId(), partId)) {
      throw new NotFoundException("JLPT exam question not found in this part");
    }
    return question;
  }

  private JlptExamAnswer requireAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId) {
    requireQuestion(examId, sessionId, partId, questionId);
    JlptExamAnswer answer = answerRepository.findById(answerId)
        .orElseThrow(() -> new NotFoundException("JLPT exam answer not found"));
    if (!Objects.equals(answer.getJlptExamQuestion().getId(), questionId)) {
      throw new NotFoundException("JLPT exam answer not found in this question");
    }
    return answer;
  }

  private Long replaceMedia(Long oldMediaId, Long newMediaId, FileTypeEnum expectedType) {
    if (Objects.equals(oldMediaId, newMediaId)) {
      return oldMediaId;
    }
    Media replacement = null;
    if (newMediaId != null) {
      replacement = mediaRepository.findByIdAndIsDeletedFalse(newMediaId)
          .orElseThrow(() -> new NotFoundException("Media not found"));
      if (replacement.getFileType() != expectedType) {
        throw new BadRequestException("Media has an invalid file type");
      }
      if (Boolean.TRUE.equals(replacement.getIsUsed())) {
        throw new ConflictException("Media is already in use");
      }
    }
    releaseMedia(oldMediaId);
    if (replacement != null) {
      replacement.setIsUsed(true);
    }
    return newMediaId;
  }

  private void releaseMedia(Long mediaId) {
    if (mediaId != null) {
      mediaRepository.findById(mediaId).ifPresent(media -> media.setIsUsed(false));
    }
  }

  private void releaseMediaForSession(Long sessionId) {
    partRepository.findByJlptExamSession_IdOrderBySortOrderAsc(sessionId)
        .forEach(this::releaseMediaForPart);
  }

  private void releaseMediaForPart(JlptExamPart part) {
    releaseMedia(part.getAudioMediaId());
    questionRepository.findByJlptExamPartIdOrderBySortOrderAsc(part.getId())
        .forEach(question -> {
          releaseMedia(question.getImageMediaId());
          answerRepository.deleteAll(
              answerRepository.findByJlptExamQuestionIdOrderBySortOrderAsc(question.getId()));
        });
    answerRepository.flush();
  }

  private void recalculateTotalTime(JlptExam exam) {
    int totalTime = sessionRepository.findByJlptExam_IdOrderBySortOrderAsc(exam.getId()).stream()
        .map(JlptExamSession::getTimeLimitMinutes)
        .filter(Objects::nonNull)
        .mapToInt(Integer::intValue)
        .sum();
    exam.setTotalTimeMinutes(totalTime);
    examRepository.save(exam);
  }

  private AdminJlptExamDetailResponse.SessionResponse sessionFromDetail(
      AdminJlptExamDetailResponse detail, Long sessionId) {
    return detail.getSessions().stream()
        .filter(session -> Objects.equals(session.getId(), sessionId))
        .findFirst()
        .orElseThrow(() -> new NotFoundException("JLPT exam session not found"));
  }

  private AdminJlptExamDetailResponse.PartResponse partFromDetail(
      AdminJlptExamDetailResponse detail, Long sessionId, Long partId) {
    return sessionFromDetail(detail, sessionId).getParts().stream()
        .filter(part -> Objects.equals(part.getId(), partId))
        .findFirst()
        .orElseThrow(() -> new NotFoundException("JLPT exam part not found"));
  }

  private AdminJlptExamDetailResponse.QuestionResponse questionFromDetail(
      AdminJlptExamDetailResponse detail, Long sessionId, Long partId, Long questionId) {
    return partFromDetail(detail, sessionId, partId).getQuestions().stream()
        .filter(question -> Objects.equals(question.getId(), questionId))
        .findFirst()
        .orElseThrow(() -> new NotFoundException("JLPT exam question not found"));
  }

  private Sort buildSort(AdminJlptExamQuery query) {
    Map<String, String> allowedFields = new HashMap<>();
    allowedFields.put("id", "id");
    allowedFields.put("title", "title");
    allowedFields.put("level", "jlptLevel");
    allowedFields.put("totalTimeMinutes", "totalTimeMinutes");
    allowedFields.put("status", "isPublished");
    allowedFields.put("createdAt", "createdAt");
    allowedFields.put("updatedAt", "updatedAt");
    String field = allowedFields.getOrDefault(query.getSortKey(), "updatedAt");
    Sort.Direction direction;
    try {
      direction = Sort.Direction.fromString(query.getSortType());
    } catch (IllegalArgumentException exception) {
      direction = Sort.Direction.DESC;
    }
    return Sort.by(direction, field);
  }

  private String trimToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
