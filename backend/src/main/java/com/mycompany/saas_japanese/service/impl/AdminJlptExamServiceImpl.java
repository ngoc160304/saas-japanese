package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;
import java.util.ArrayList;
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
import org.springframework.transaction.annotation.Isolation;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.query.AdminJlptExamQuery;
import com.mycompany.saas_japanese.domain.query.AdminJlptExamStatsQuery;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptAnswer;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptExam;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptPart;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptQuestion;
import com.mycompany.saas_japanese.domain.request.ReqSaveAdminJlptQuestion;
import com.mycompany.saas_japanese.domain.request.ReqSaveAdminJlptQuestion.AnswerInput;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptSession;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamSummaryResponse;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamStatsResponse;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamValidationResponse;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionStatistics;
import com.mycompany.saas_japanese.repository.JlptExamContentCounts;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.service.AdminJlptExamService;
import com.mycompany.saas_japanese.service.mapper.AdminJlptExamMapper;
import com.mycompany.saas_japanese.specification.JlptExamSpecs;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.GrammarHtmlSanitizer;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.ConflictException;
import com.mycompany.saas_japanese.util.error.NotFoundException;
import com.mycompany.saas_japanese.util.error.JlptPublishValidationException;

import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;

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
  private final CourseRepository courseRepository;
  private final CourseCategoryRepository categoryRepository;
  private final LessonRepository lessonRepository;
  private final GrammarHtmlSanitizer htmlSanitizer;
  private final JlptExamPublishValidator publishValidator;

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
    Map<Long, JlptExamSessionStatistics> sessionStatistics = examIds.isEmpty() ? Map.of()
        : sessionRepository.summarizeByExamIds(examIds).stream()
            .collect(Collectors.toMap(JlptExamSessionStatistics::getExamId, Function.identity()));
    Map<Long, JlptExamContentCounts> contentCounts = examIds.isEmpty() ? Map.of()
        : partRepository.countContentByExamIds(examIds).stream()
            .collect(Collectors.toMap(JlptExamContentCounts::getExamId, Function.identity()));
    return exams.map(exam -> {
      JlptExamSessionStatistics session = sessionStatistics.get(exam.getId());
      JlptExamContentCounts content = contentCounts.get(exam.getId());
      return mapper.toSummary(exam, attemptedExamIds.contains(exam.getId()),
          session == null ? 0 : session.getSessionCount(),
          content == null ? 0 : content.getPartCount(),
          content == null ? 0 : content.getQuestionCount(),
          session == null ? 0 : Math.toIntExact(session.getTotalTimeMinutes()));
    });
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamStatsResponse statistics(AdminJlptExamStatsQuery query) {
    return examRepository.summarizeAdminExams(trimToNull(query.getSearch()), query.getLevel());
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamDetailResponse findById(Long examId) {
    JlptExam exam = requireExam(examId);
    return mapDetail(exam);
  }

  @Override
  @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
  public AdminJlptExamValidationResponse validate(Long examId) {
    return publishValidator.validate(requireExam(examId));
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
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
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse update(Long examId, ReqAdminJlptExam request) {
    JlptExam exam = requireEditableExam(examId);
    exam.setJlptLevel(request.getLevel());
    exam.setTitle(request.getTitle().trim());
    exam.setDescription(trimToNull(request.getDescription()));
    return mapDetail(examRepository.save(exam));
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse publish(Long examId) {
    JlptExam exam = requireActiveExam(examId);
    AdminJlptExamValidationResponse validation = publishValidator.validate(exam);
    if (!validation.canPublish()) {
      throw new JlptPublishValidationException(validation.issues());
    }
    exam.setTotalTimeMinutes(Math.toIntExact(validation.totalTimeMinutes()));
    exam.setIsPublished(true);
    return mapDetail(examRepository.save(exam));
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse unpublish(Long examId) {
    JlptExam exam = requireActiveExam(examId);
    exam.setIsPublished(false);
    return mapDetail(examRepository.save(exam));
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
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
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.SessionResponse createSession(
      Long examId, ReqAdminJlptSession request) {
    JlptExam exam = requireEditableExam(examId);
    List<JlptExamSession> siblings = sessionRepository.findByJlptExamIdOrderBySortOrderAscIdAsc(examId);
    JlptExamSession session = JlptExamSession.builder()
        .jlptExam(exam)
        .name(request.getName().trim())
        .sessionType(request.getSessionType())
        .timeLimitMinutes(request.getTimeLimitMinutes())
        .sortOrder(request.getSortOrder())
        .build();
    JlptSiblingOrder.insert(siblings, session, request.getSortOrder(), JlptExamSession::setSortOrder);
    session = sessionRepository.save(session);
    recalculateTotalTime(exam);
    return findSession(examId, session.getId());
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.SessionResponse updateSession(
      Long examId, Long sessionId, ReqAdminJlptSession request) {
    JlptExam exam = requireEditableExam(examId);
    JlptExamSession session = requireSession(examId, sessionId);
    session.setName(request.getName().trim());
    session.setSessionType(request.getSessionType());
    session.setTimeLimitMinutes(request.getTimeLimitMinutes());
    JlptSiblingOrder.move(sessionRepository.findByJlptExamIdOrderBySortOrderAscIdAsc(examId),
        session, request.getSortOrder(), JlptExamSession::setSortOrder);
    sessionRepository.save(session);
    recalculateTotalTime(exam);
    return findSession(examId, sessionId);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.SessionResponse updateSessionSortOrder(
      Long examId, Long sessionId, Integer sortOrder) {
    requireEditableExam(examId);
    JlptExamSession session = requireSession(examId, sessionId);
    JlptSiblingOrder.move(sessionRepository.findByJlptExamIdOrderBySortOrderAscIdAsc(examId),
        session, sortOrder, JlptExamSession::setSortOrder);
    sessionRepository.save(session);
    return findSession(examId, sessionId);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public void deleteSession(Long examId, Long sessionId) {
    JlptExam exam = requireEditableExam(examId);
    JlptExamSession session = requireSession(examId, sessionId);
    List<JlptExamPart> parts = partRepository.findByJlptExamSessionIdOrderBySortOrderAscIdAsc(sessionId);
    List<JlptExamQuestion> questions = questionsForParts(parts);
    Set<Long> mediaIds = referencedMedia(parts, questions);
    lockMedia(mediaIds);
    deleteAnswers(questions);
    sessionRepository.delete(session);
    sessionRepository.flush();
    releaseMedia(mediaIds);
    JlptSiblingOrder.assign(sessionRepository.findByJlptExamIdOrderBySortOrderAscIdAsc(examId),
        JlptExamSession::setSortOrder);
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
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.PartResponse createPart(
      Long examId, Long sessionId, ReqAdminJlptPart request) {
    requireEditableExam(examId);
    JlptExamSession session = requireSession(examId, sessionId);
    List<JlptExamPart> siblings = partRepository.findByJlptExamSessionIdOrderBySortOrderAscIdAsc(sessionId);
    Long audioMediaId = replaceMedia(null, request.getAudioMediaId(), FileTypeEnum.AUDIO);
    JlptExamPart part = JlptExamPart.builder()
        .jlptExamSession(session)
        .name(request.getName().trim())
        .instructions(trimToNull(request.getInstructions()))
        .sortOrder(request.getSortOrder())
        .audioMediaId(audioMediaId)
        .build();
    JlptSiblingOrder.insert(siblings, part, request.getSortOrder(), JlptExamPart::setSortOrder);
    part = partRepository.save(part);
    return findPart(examId, sessionId, part.getId());
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.PartResponse updatePart(
      Long examId, Long sessionId, Long partId, ReqAdminJlptPart request) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    part.setName(request.getName().trim());
    part.setInstructions(trimToNull(request.getInstructions()));
    JlptSiblingOrder.move(partRepository.findByJlptExamSessionIdOrderBySortOrderAscIdAsc(sessionId),
        part, request.getSortOrder(), JlptExamPart::setSortOrder);
    Long oldMediaId = part.getAudioMediaId();
    part.setAudioMediaId(replaceMedia(
        part.getAudioMediaId(), request.getAudioMediaId(), FileTypeEnum.AUDIO));
    partRepository.saveAndFlush(part);
    releaseMedia(oldMediaId);
    return findPart(examId, sessionId, partId);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.PartResponse updatePartSortOrder(
      Long examId, Long sessionId, Long partId, Integer sortOrder) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    JlptSiblingOrder.move(partRepository.findByJlptExamSessionIdOrderBySortOrderAscIdAsc(sessionId),
        part, sortOrder, JlptExamPart::setSortOrder);
    partRepository.save(part);
    return findPart(examId, sessionId, partId);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public void deletePart(Long examId, Long sessionId, Long partId) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    List<JlptExamQuestion> questions = questionsForParts(List.of(part));
    Set<Long> mediaIds = referencedMedia(List.of(part), questions);
    lockMedia(mediaIds);
    deleteAnswers(questions);
    partRepository.delete(part);
    partRepository.flush();
    releaseMedia(mediaIds);
    JlptSiblingOrder.assign(partRepository.findByJlptExamSessionIdOrderBySortOrderAscIdAsc(sessionId),
        JlptExamPart::setSortOrder);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamDetailResponse.QuestionResponse findQuestion(
      Long examId, Long sessionId, Long partId, Long questionId) {
    requireQuestion(examId, sessionId, partId, questionId);
    return questionFromDetail(mapDetail(requireExam(examId)), sessionId, partId, questionId);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.QuestionResponse createQuestion(
      Long examId, Long sessionId, Long partId, ReqAdminJlptQuestion request) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    List<JlptExamQuestion> siblings = questionRepository.findByJlptExamPartIdOrderBySortOrderAscIdAsc(partId);
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
    JlptSiblingOrder.insert(siblings, question, request.getSortOrder(), JlptExamQuestion::setSortOrder);
    question = questionRepository.save(question);
    return findQuestion(examId, sessionId, partId, question.getId());
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
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
    JlptSiblingOrder.move(questionRepository.findByJlptExamPartIdOrderBySortOrderAscIdAsc(partId),
        question, request.getSortOrder(), JlptExamQuestion::setSortOrder);
    Long oldMediaId = question.getImageMediaId();
    question.setImageMediaId(replaceMedia(
        question.getImageMediaId(), request.getImageMediaId(), FileTypeEnum.IMAGE));
    questionRepository.saveAndFlush(question);
    releaseMedia(oldMediaId);
    return findQuestion(examId, sessionId, partId, questionId);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.QuestionResponse updateQuestionSortOrder(
      Long examId, Long sessionId, Long partId, Long questionId, Integer sortOrder) {
    requireEditableExam(examId);
    JlptExamQuestion question = requireQuestion(examId, sessionId, partId, questionId);
    JlptSiblingOrder.move(questionRepository.findByJlptExamPartIdOrderBySortOrderAscIdAsc(partId),
        question, sortOrder, JlptExamQuestion::setSortOrder);
    questionRepository.save(question);
    return findQuestion(examId, sessionId, partId, questionId);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public void deleteQuestion(Long examId, Long sessionId, Long partId, Long questionId) {
    requireEditableExam(examId);
    JlptExamQuestion question = requireQuestion(examId, sessionId, partId, questionId);
    lockMedia(referencedMedia(List.of(), List.of(question)));
    deleteAnswers(List.of(question));
    questionRepository.delete(question);
    questionRepository.flush();
    releaseMedia(question.getImageMediaId());
    JlptSiblingOrder.assign(questionRepository.findByJlptExamPartIdOrderBySortOrderAscIdAsc(partId),
        JlptExamQuestion::setSortOrder);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminJlptExamDetailResponse.AnswerResponse findAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId) {
    JlptExamAnswer answer = requireAnswer(examId, sessionId, partId, questionId, answerId);
    return mapper.toAnswer(answer);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.AnswerResponse createAnswer(
      Long examId, Long sessionId, Long partId, Long questionId,
      ReqAdminJlptAnswer request) {
    requireEditableExam(examId);
    JlptExamQuestion question = requireQuestion(examId, sessionId, partId, questionId);
    List<JlptExamAnswer> siblings = answerRepository.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(questionId);
    JlptExamAnswer answer = JlptExamAnswer.builder()
        .jlptExamQuestion(question)
        .answerText(request.getAnswerText().trim())
        .isCorrect(request.getIsCorrect())
        .sortOrder(request.getSortOrder())
        .build();
    JlptSiblingOrder.insert(siblings, answer, request.getSortOrder(), JlptExamAnswer::setSortOrder);
    return mapper.toAnswer(answerRepository.save(answer));
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.AnswerResponse updateAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId,
      ReqAdminJlptAnswer request) {
    requireEditableExam(examId);
    JlptExamAnswer answer = requireAnswer(examId, sessionId, partId, questionId, answerId);
    answer.setAnswerText(request.getAnswerText().trim());
    answer.setIsCorrect(request.getIsCorrect());
    JlptSiblingOrder.move(answerRepository.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(questionId),
        answer, request.getSortOrder(), JlptExamAnswer::setSortOrder);
    return mapper.toAnswer(answerRepository.save(answer));
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.AnswerResponse updateAnswerSortOrder(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId,
      Integer sortOrder) {
    requireEditableExam(examId);
    JlptExamAnswer answer = requireAnswer(examId, sessionId, partId, questionId, answerId);
    JlptSiblingOrder.move(answerRepository.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(questionId),
        answer, sortOrder, JlptExamAnswer::setSortOrder);
    return mapper.toAnswer(answerRepository.save(answer));
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public void deleteAnswer(
      Long examId, Long sessionId, Long partId, Long questionId, Long answerId) {
    requireEditableExam(examId);
    answerRepository.delete(requireAnswer(examId, sessionId, partId, questionId, answerId));
    answerRepository.flush();
    JlptSiblingOrder.assign(answerRepository.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(questionId),
        JlptExamAnswer::setSortOrder);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public List<AdminJlptExamDetailResponse.SessionResponse> reorderSessions(Long examId, List<Long> ids) {
    JlptExam exam = requireEditableExam(examId);
    JlptSiblingOrder.reorder(sessionRepository.findByJlptExamIdOrderBySortOrderAscIdAsc(examId), ids,
        JlptExamSession::getId, JlptExamSession::setSortOrder);
    sessionRepository.flush();
    return mapDetail(exam).getSessions();
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public List<AdminJlptExamDetailResponse.PartResponse> reorderParts(Long examId, Long sessionId, List<Long> ids) {
    JlptExam exam = requireEditableExam(examId);
    requireSession(examId, sessionId);
    JlptSiblingOrder.reorder(partRepository.findByJlptExamSessionIdOrderBySortOrderAscIdAsc(sessionId), ids,
        JlptExamPart::getId, JlptExamPart::setSortOrder);
    partRepository.flush();
    return sessionFromDetail(mapDetail(exam), sessionId).getParts();
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public List<AdminJlptExamDetailResponse.QuestionResponse> reorderQuestions(
      Long examId, Long sessionId, Long partId, List<Long> ids) {
    JlptExam exam = requireEditableExam(examId);
    requirePart(examId, sessionId, partId);
    JlptSiblingOrder.reorder(questionRepository.findByJlptExamPartIdOrderBySortOrderAscIdAsc(partId), ids,
        JlptExamQuestion::getId, JlptExamQuestion::setSortOrder);
    questionRepository.flush();
    return partFromDetail(mapDetail(exam), sessionId, partId).getQuestions();
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public List<AdminJlptExamDetailResponse.AnswerResponse> reorderAnswers(
      Long examId, Long sessionId, Long partId, Long questionId, List<Long> ids) {
    requireEditableExam(examId);
    requireQuestion(examId, sessionId, partId, questionId);
    JlptSiblingOrder.reorder(answerRepository.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(questionId), ids,
        JlptExamAnswer::getId, JlptExamAnswer::setSortOrder);
    answerRepository.flush();
    return answerRepository.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(questionId).stream()
        .map(mapper::toAnswer).toList();
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.QuestionResponse createQuestionWithAnswers(
      Long examId, Long sessionId, Long partId, ReqSaveAdminJlptQuestion request) {
    return saveCompleteQuestion(examId, sessionId, partId, null, request);
  }

  @Override
  @Transactional(isolation = Isolation.READ_COMMITTED)
  public AdminJlptExamDetailResponse.QuestionResponse updateQuestionWithAnswers(
      Long examId, Long sessionId, Long partId, Long questionId, ReqSaveAdminJlptQuestion request) {
    return saveCompleteQuestion(examId, sessionId, partId, questionId, request);
  }

  private AdminJlptExamDetailResponse.QuestionResponse saveCompleteQuestion(
      Long examId, Long sessionId, Long partId, Long questionId, ReqSaveAdminJlptQuestion request) {
    requireEditableExam(examId);
    JlptExamPart part = requirePart(examId, sessionId, partId);
    JlptExamQuestion question = questionId == null ? JlptExamQuestion.builder().jlptExamPart(part).build()
        : requireQuestion(examId, sessionId, partId, questionId);
    List<JlptExamQuestion> siblings = questionRepository.findByJlptExamPartIdOrderBySortOrderAscIdAsc(partId);
    List<JlptExamAnswer> current = questionId == null ? List.of()
        : answerRepository.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(questionId);
    Map<Long, JlptExamAnswer> byId = current.stream()
        .collect(Collectors.toMap(JlptExamAnswer::getId, Function.identity()));
    QuestionContent content = validateCompleteQuestion(request, byId);
    JlptSiblingOrder.requirePosition(request.getSortOrder(), siblings.size() - (questionId == null ? 0 : 1));

    // All body/ownership/membership/position checks precede media or entity mutations.
    Long oldMediaId = question.getImageMediaId();
    Long newMediaId = replaceMedia(oldMediaId, request.getImageMediaId(), FileTypeEnum.IMAGE);
    question.setQuestionText(content.questionText());
    question.setPassageText(content.passageText());
    question.setExplanation(content.explanation());
    question.setQuestionType(request.getQuestionType());
    question.setPoints(request.getPoints());
    question.setImageMediaId(newMediaId);
    if (questionId == null) {
      JlptSiblingOrder.insert(siblings, question, request.getSortOrder(), JlptExamQuestion::setSortOrder);
    } else {
      JlptSiblingOrder.move(siblings, question, request.getSortOrder(), JlptExamQuestion::setSortOrder);
    }
    questionRepository.save(question);

    Set<Long> retained = content.answers().stream().map(AnswerInput::id).filter(Objects::nonNull)
        .collect(Collectors.toSet());
    answerRepository.deleteAll(current.stream().filter(answer -> !retained.contains(answer.getId())).toList());
    List<JlptExamAnswer> saved = new ArrayList<>();
    for (AnswerInput input : content.answers()) {
      JlptExamAnswer answer = input.id() == null
          ? JlptExamAnswer.builder().jlptExamQuestion(question).build() : byId.get(input.id());
      answer.setAnswerText(input.answerText());
      answer.setIsCorrect(input.isCorrect());
      saved.add(answer);
    }
    JlptSiblingOrder.assign(saved, JlptExamAnswer::setSortOrder);
    answerRepository.saveAll(saved);
    answerRepository.flush();
    releaseMedia(oldMediaId);
    return findQuestion(examId, sessionId, partId, question.getId());
  }

  private QuestionContent validateCompleteQuestion(
      ReqSaveAdminJlptQuestion request, Map<Long, JlptExamAnswer> current) {
    List<AnswerInput> inputs = request.getAnswers();
    if (request.getQuestionType() != JlptQuestionEnum.single_choice || inputs == null || inputs.size() < 2
        || inputs.stream().anyMatch(Objects::isNull)
        || inputs.stream().filter(answer -> Boolean.TRUE.equals(answer.isCorrect())).count() != 1) {
      throw new BadRequestException(
          "A single-choice question needs at least two answers and exactly one correct answer");
    }
    Set<Long> seen = new HashSet<>();
    List<AnswerInput> normalized = new ArrayList<>();
    for (int index = 0; index < inputs.size(); index++) {
      AnswerInput input = inputs.get(index);
      if (input.id() != null && (!seen.add(input.id()) || !current.containsKey(input.id()))) {
        throw new BadRequestException("Answer IDs must be unique existing answers belonging to this question");
      }
      if (input.sortOrder() != null && input.sortOrder() != index) {
        throw new BadRequestException("Answer sort order must match its zero-based array position");
      }
      normalized.add(new AnswerInput(input.id(), safeText(input.answerText(), 500, true), input.isCorrect(), index));
    }
    return new QuestionContent(safeText(request.getQuestionText(), 20000, true),
        safeText(request.getPassageText(), 50000, false), safeText(request.getExplanation(), 20000, false),
        normalized);
  }

  private String safeText(String value, int maximum, boolean required) {
    String cleaned = htmlSanitizer.sanitize(value);
    if (required && (cleaned == null || Jsoup.parse(cleaned).text().replace('\u00a0', ' ').isBlank())) {
      throw new BadRequestException("Required question/answer text must contain visible text");
    }
    if (cleaned != null && cleaned.length() > maximum) {
      throw new BadRequestException("Sanitized text must not exceed " + maximum + " characters");
    }
    return cleaned;
  }

  private record QuestionContent(
      String questionText, String passageText, String explanation, List<AnswerInput> answers) { }

  private AdminJlptExamDetailResponse mapDetail(JlptExam exam) {
    List<JlptExamSession> sessions = sessionRepository.findByJlptExamIdOrderBySortOrderAscIdAsc(exam.getId());
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

    Map<Long, List<AdminJlptExamDetailResponse.QuestionResponse>> questionsByPart = new HashMap<>();
    for (JlptExamQuestion question : questions) {
      questionsByPart.computeIfAbsent(question.getJlptExamPart().getId(), ignored -> new ArrayList<>())
          .add(mapper.toQuestion(question,
              question.getImageMediaId() == null ? null : mediaById.get(question.getImageMediaId()),
              answersByQuestion.getOrDefault(question.getId(), List.of()).stream()
                  .map(mapper::toAnswer).toList()));
    }

    Map<Long, List<AdminJlptExamDetailResponse.PartResponse>> partsBySession = new HashMap<>();
    for (JlptExamPart part : parts) {
      partsBySession.computeIfAbsent(part.getJlptExamSession().getId(), ignored -> new ArrayList<>())
          .add(mapper.toPart(part,
              part.getAudioMediaId() == null ? null : mediaById.get(part.getAudioMediaId()),
              questionsByPart.getOrDefault(part.getId(), List.of())));
    }

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

  private JlptExam requireExam(Long examId) {
    return examRepository.findById(examId)
        .orElseThrow(() -> new NotFoundException("JLPT exam not found"));
  }

  private JlptExam requireActiveExam(Long examId) {
    // Every hierarchy/lifecycle writer takes this root lock before reading membership.
    return examRepository.findActiveForUpdate(examId)
        .orElseThrow(() -> new NotFoundException("JLPT exam not found"));
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
    Media replacement = null;
    List<Long> ids = java.util.stream.Stream.of(oldMediaId, newMediaId).filter(Objects::nonNull).toList();
    Map<Long, Media> locked = lockMedia(ids);
    if (newMediaId != null) {
      replacement = locked.get(newMediaId);
      if (replacement == null) {
        throw new NotFoundException("Media not found");
      }
      if (replacement.getFileType() != expectedType) {
        throw new BadRequestException("Media has an invalid file type");
      }
      if (!Objects.equals(oldMediaId, newMediaId)
          && (Boolean.TRUE.equals(replacement.getIsUsed()) || isMediaReferenced(newMediaId))) {
        throw new ConflictException("Media is already in use");
      }
    }
    if (replacement != null) {
      replacement.setIsUsed(true);
    }
    return newMediaId;
  }

  private void releaseMedia(Long mediaId) {
    if (mediaId != null) {
      mediaRepository.findActiveForUpdate(mediaId)
          .ifPresent(media -> media.setIsUsed(isMediaReferenced(mediaId)));
    }
  }

  private void releaseMedia(Collection<Long> mediaIds) {
    mediaIds.stream().sorted().forEach(this::releaseMedia);
  }

  private boolean isMediaReferenced(Long id) {
    return partRepository.existsByAudioMediaId(id) || questionRepository.existsByImageMediaId(id)
        || courseRepository.existsByThumbnailMediaIdAndIsDeletedFalse(id)
        || categoryRepository.existsByMediaIdAndIsDeletedFalse(id)
        || lessonRepository.existsByVideoMediaIdAndIsDeletedFalse(id);
  }

  private Map<Long, Media> lockMedia(Collection<Long> ids) {
    Map<Long, Media> locked = new HashMap<>();
    ids.stream().distinct().sorted().forEach(id -> mediaRepository.findActiveForUpdate(id)
        .ifPresent(media -> locked.put(id, media)));
    return locked;
  }

  private Set<Long> referencedMedia(List<JlptExamPart> parts, List<JlptExamQuestion> questions) {
    Set<Long> ids = new HashSet<>();
    parts.stream().map(JlptExamPart::getAudioMediaId).filter(Objects::nonNull).forEach(ids::add);
    questions.stream().map(JlptExamQuestion::getImageMediaId).filter(Objects::nonNull).forEach(ids::add);
    return ids;
  }

  private List<JlptExamQuestion> questionsForParts(List<JlptExamPart> parts) {
    return parts.isEmpty() ? List.of() : questionRepository.findAdminQuestionsByPartIds(
        parts.stream().map(JlptExamPart::getId).toList());
  }

  private void deleteAnswers(List<JlptExamQuestion> questions) {
    if (!questions.isEmpty()) {
      answerRepository.deleteAll(answerRepository.findAdminAnswersByQuestionIds(
          questions.stream().map(JlptExamQuestion::getId).toList()));
    }
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
    Sort sort = Sort.by(direction, field);
    return field.equals("id") ? sort : sort.and(Sort.by(direction, "id"));
  }

  private String trimToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
