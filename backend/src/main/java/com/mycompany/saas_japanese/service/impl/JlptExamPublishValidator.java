package com.mycompany.saas_japanese.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.jsoup.Jsoup;
import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamValidationResponse;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamValidationResponse.Category;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamValidationResponse.Issue;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.util.constant.AdminJlptExamStatus;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JlptExamPublishValidator {
  private final JlptExamSessionRepository sessionRepository;
  private final JlptExamPartRepository partRepository;
  private final JlptExamQuestionRepository questionRepository;
  private final JlptExamAnswerRepository answerRepository;
  private final MediaRepository mediaRepository;
  private final UserJlptAttemptRepository attemptRepository;

  // The caller supplies a transaction: a read snapshot for inspection, the root write lock for publish.
  public AdminJlptExamValidationResponse validate(JlptExam exam) {
    List<JlptExamSession> sessions = sessionRepository.findByJlptExamIdOrderBySortOrderAscIdAsc(exam.getId());
    List<JlptExamPart> parts = sessions.isEmpty() ? List.of() : partRepository.findAdminPartsBySessionIds(
        sessions.stream().map(JlptExamSession::getId).toList());
    List<JlptExamQuestion> questions = parts.isEmpty() ? List.of() : questionRepository.findAdminQuestionsByPartIds(
        parts.stream().map(JlptExamPart::getId).toList());
    List<JlptExamAnswer> answers = questions.isEmpty() ? List.of() : answerRepository.findAdminAnswersByQuestionIds(
        questions.stream().map(JlptExamQuestion::getId).toList());
    Map<Long, List<JlptExamPart>> partsBySession = parts.stream()
        .collect(Collectors.groupingBy(part -> part.getJlptExamSession().getId()));
    Map<Long, List<JlptExamQuestion>> questionsByPart = questions.stream()
        .collect(Collectors.groupingBy(question -> question.getJlptExamPart().getId()));
    Map<Long, List<JlptExamAnswer>> answersByQuestion = answers.stream()
        .collect(Collectors.groupingBy(answer -> answer.getJlptExamQuestion().getId()));
    Map<Long, Media> media = loadMedia(parts, questions);
    List<Issue> issues = new ArrayList<>();
    Location root = new Location("", Map.of("examId", exam.getId()));
    requiredText(exam.getTitle(), 200, root, "title", issues);
    optionalText(exam.getDescription(), 500, root, "description", issues);
    if (exam.getJlptLevel() == null) {
      add(issues, "EXAM_LEVEL_REQUIRED", "A supported JLPT level is required", root, "level");
    }
    requireChildren(sessions, root, "sessions", issues);
    ordering(sessions, JlptExamSession::getSortOrder, JlptExamSession::getId, root, "sessions", issues);
    long duration = 0;
    for (JlptExamSession session : sessions) {
      Location location = root.child("sessions", "sessionId", session.getId());
      requiredText(session.getName(), 150, location, "name", issues);
      if (session.getSessionType() == null || !Set.of(JlptSessionEnum.values()).contains(session.getSessionType())) {
        add(issues, "SESSION_TYPE_UNSUPPORTED", "A supported session type is required", location, "sessionType");
      }
      Integer minutes = session.getTimeLimitMinutes();
      if (minutes == null || minutes < 1 || minutes > 180) {
        add(issues, "SESSION_DURATION_INVALID", "Session time limit must be between 1 and 180 minutes",
            location, "timeLimitMinutes");
      }
      duration += minutes == null ? 0 : minutes;
      List<JlptExamPart> children = partsBySession.getOrDefault(session.getId(), List.of());
      requireChildren(children, location, "parts", issues);
      ordering(children, JlptExamPart::getSortOrder, JlptExamPart::getId, location, "parts", issues);
      for (JlptExamPart part : children) {
        validatePart(part, location.child("parts", "partId", part.getId()), questionsByPart,
            answersByQuestion, media, issues);
      }
    }
    if (duration < 0 || duration > Integer.MAX_VALUE) {
      add(issues, "EXAM_DURATION_INVALID", "Combined session duration is outside the supported range",
          root, "totalTimeMinutes");
    }
    boolean contentValid = issues.isEmpty();
    boolean archived = Boolean.TRUE.equals(exam.getIsDeleted());
    boolean published = Boolean.TRUE.equals(exam.getIsPublished());
    boolean hasAttempts = attemptRepository.existsByJlptExam_Id(exam.getId());
    if (archived) {
      issues.add(new Issue("EXAM_ARCHIVED", "Archived exams cannot be published", "status",
          Category.LIFECYCLE, root.ids()));
    }
    AdminJlptExamStatus status = archived ? AdminJlptExamStatus.ARCHIVED
        : published ? AdminJlptExamStatus.PUBLISHED : AdminJlptExamStatus.DRAFT;
    return new AdminJlptExamValidationResponse(exam.getId(), status, contentValid, contentValid && !archived,
        hasAttempts, archived || published || hasAttempts, duration, issues);
  }

  private void validatePart(JlptExamPart part, Location location,
      Map<Long, List<JlptExamQuestion>> questionsByPart, Map<Long, List<JlptExamAnswer>> answersByQuestion,
      Map<Long, Media> media, List<Issue> issues) {
    requiredText(part.getName(), 150, location, "name", issues);
    optionalText(part.getInstructions(), 10000, location, "instructions", issues);
    validateMedia(part.getAudioMediaId(), FileTypeEnum.AUDIO, media, location, "audioMediaId", issues);
    List<JlptExamQuestion> questions = questionsByPart.getOrDefault(part.getId(), List.of());
    requireChildren(questions, location, "questions", issues);
    ordering(questions, JlptExamQuestion::getSortOrder, JlptExamQuestion::getId, location, "questions", issues);
    for (JlptExamQuestion question : questions) {
      validateQuestion(question, location.child("questions", "questionId", question.getId()),
          answersByQuestion.getOrDefault(question.getId(), List.of()), media, issues);
    }
  }

  private void validateQuestion(JlptExamQuestion question, Location location, List<JlptExamAnswer> answers,
      Map<Long, Media> media, List<Issue> issues) {
    requiredText(question.getQuestionText(), 20000, location, "questionText", issues);
    optionalText(question.getPassageText(), 50000, location, "passageText", issues);
    optionalText(question.getExplanation(), 20000, location, "explanation", issues);
    if (question.getQuestionType() != JlptQuestionEnum.single_choice) {
      add(issues, "QUESTION_TYPE_UNSUPPORTED", "Only single_choice questions are supported", location, "questionType");
    }
    BigDecimal points = question.getPoints();
    if (points == null || points.compareTo(new BigDecimal("0.01")) < 0
        || points.compareTo(new BigDecimal("999.99")) > 0 || points.scale() > 2) {
      add(issues, "QUESTION_POINTS_INVALID", "Points must be between 0.01 and 999.99 with at most two decimals",
          location, "points");
    }
    validateMedia(question.getImageMediaId(), FileTypeEnum.IMAGE, media, location, "imageMediaId", issues);
    if (answers.size() < 2) {
      add(issues, "ANSWERS_TOO_FEW", "Each single-choice question must have at least two answers",
          location, "answers");
    }
    if (answers.stream().filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect())).count() != 1) {
      add(issues, "CORRECT_ANSWER_COUNT", "Each single-choice question must have exactly one correct answer",
          location, "answers");
    }
    ordering(answers, JlptExamAnswer::getSortOrder, JlptExamAnswer::getId, location, "answers", issues);
    for (JlptExamAnswer answer : answers) {
      Location answerLocation = location.child("answers", "answerId", answer.getId());
      requiredText(answer.getAnswerText(), 500, answerLocation, "answerText", issues);
      if (answer.getIsCorrect() == null) {
        add(issues, "ANSWER_CORRECTNESS_REQUIRED", "Answer correctness is required", answerLocation, "isCorrect");
      }
    }
  }

  private Map<Long, Media> loadMedia(List<JlptExamPart> parts, List<JlptExamQuestion> questions) {
    Set<Long> ids = new HashSet<>();
    parts.stream().map(JlptExamPart::getAudioMediaId).filter(Objects::nonNull).forEach(ids::add);
    questions.stream().map(JlptExamQuestion::getImageMediaId).filter(Objects::nonNull).forEach(ids::add);
    return ids.isEmpty() ? Map.of() : mediaRepository.findAllById(ids).stream()
        .collect(Collectors.toMap(Media::getId, Function.identity()));
  }

  private void validateMedia(Long id, FileTypeEnum type, Map<Long, Media> media, Location location,
      String field, List<Issue> issues) {
    if (id == null) {
      return;
    }
    Map<String, Long> ids = new HashMap<>(location.ids());
    ids.put("mediaId", id);
    Location reference = new Location(location.path(), ids);
    Media value = media.get(id);
    if (id <= 0 || value == null || !Boolean.FALSE.equals(value.getIsDeleted())) {
      add(issues, "MEDIA_UNAVAILABLE", "Referenced media must exist and be active", reference, field);
    } else if (value.getFileType() != type) {
      add(issues, "MEDIA_TYPE_INVALID", "Referenced media must have type " + type, reference, field);
    }
  }

  private void requiredText(String value, int max, Location location, String field, List<Issue> issues) {
    if (value == null || Jsoup.parse(value).text().replace('\u00a0', ' ').isBlank()) {
      add(issues, "TEXT_REQUIRED", "Nonblank " + field + " is required", location, field);
    }
    optionalText(value, max, location, field, issues);
  }

  private void optionalText(String value, int max, Location location, String field, List<Issue> issues) {
    if (value != null && value.length() > max) {
      add(issues, "TEXT_TOO_LONG", field + " must not exceed " + max + " characters", location, field);
    }
  }

  private void requireChildren(List<?> children, Location location, String field, List<Issue> issues) {
    if (children.isEmpty()) {
      add(issues, "COLLECTION_EMPTY", "At least one " + field + " item is required", location, field);
    }
  }

  private <T> void ordering(List<T> siblings, Function<T, Integer> order, Function<T, Long> id,
      Location parent, String collection, List<Issue> issues) {
    Set<Integer> seen = new HashSet<>();
    String idField = switch (collection) {
      case "sessions" -> "sessionId";
      case "parts" -> "partId";
      case "questions" -> "questionId";
      default -> "answerId";
    };
    for (T sibling : siblings) {
      Integer position = order.apply(sibling);
      if (position == null || position < 0 || position >= siblings.size() || !seen.add(position)) {
        add(issues, "SORT_ORDER_INVALID", "Sibling positions must be unique and contiguous from zero",
            parent.child(collection, idField, id.apply(sibling)), "sortOrder");
      }
    }
  }

  private static void add(List<Issue> issues, String code, String message, Location location, String field) {
    issues.add(new Issue(code, message, location.path().isEmpty() ? field : location.path() + "." + field,
        Category.CONTENT, location.ids()));
  }

  private record Location(String path, Map<String, Long> ids) {
    private Location {
      ids = Map.copyOf(ids);
    }

    private Location child(String collection, String idField, Long id) {
      Map<String, Long> childIds = new HashMap<>(ids);
      childIds.put(idField, id);
      return new Location((path.isEmpty() ? "" : path + ".") + collection + "[" + id + "]", childIds);
    }
  }
}
