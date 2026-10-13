package com.mycompany.saas_japanese.service.impl;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Quiz;
import com.mycompany.saas_japanese.domain.QuizOption;
import com.mycompany.saas_japanese.domain.QuizQuestion;
import com.mycompany.saas_japanese.domain.request.ReqAdminLessonQuiz;
import com.mycompany.saas_japanese.domain.request.ReqQuizQuestion;
import com.mycompany.saas_japanese.domain.response.AdminLessonQuizResponse;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.QuizOptionRepository;
import com.mycompany.saas_japanese.repository.QuizOptionReferenceRepository;
import com.mycompany.saas_japanese.repository.QuizQuestionRepository;
import com.mycompany.saas_japanese.repository.QuizRepository;
import com.mycompany.saas_japanese.service.AdminLessonQuizService;
import com.mycompany.saas_japanese.service.mapper.AdminLessonQuizMapper;
import com.mycompany.saas_japanese.util.constant.QuizQuestionTypeEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.ConflictException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminLessonQuizServiceImpl implements AdminLessonQuizService {
  private final LessonRepository lessons;
  private final QuizRepository quizzes;
  private final QuizQuestionRepository questions;
  private final QuizOptionRepository options;
  private final QuizOptionReferenceRepository optionReferences;
  private final AdminLessonQuizMapper mapper;

  @Override
  @Transactional(readOnly = true)
  public Optional<AdminLessonQuizResponse> findCurrent(Long lessonId) {
    lessons.findByIdAndIsDeletedFalse(lessonId).orElseThrow(() -> new NotFoundException("Lesson not found"));
    return single(quizzes.findByLessonIdAndDeletedAtIsNull(lessonId)).map(this::response);
  }

  @Override
  public AdminLessonQuizResponse create(Long lessonId, ReqAdminLessonQuiz request) {
    Lesson lesson = lockLesson(lessonId);
    if (single(quizzes.findActiveForUpdate(lessonId)).isPresent()) {
      throw new ConflictException("This lesson already has an active quiz");
    }
    Quiz quiz = Quiz.builder().lesson(lesson).title(request.title().strip())
        .description(request.description().strip()).isPublished(false).build();
    quizzes.saveAndFlush(quiz);
    return response(quiz);
  }

  @Override
  public AdminLessonQuizResponse update(Long lessonId, Long quizId, ReqAdminLessonQuiz request) {
    Quiz quiz = lockQuiz(lessonId, quizId);
    quiz.setTitle(request.title().strip());
    quiz.setDescription(request.description().strip());
    return finish(quiz);
  }

  @Override
  public AdminLessonQuizResponse publish(Long lessonId, Long quizId, boolean published) {
    Quiz quiz = lockQuiz(lessonId, quizId);
    if (published) {
      validatePublishable(quiz);
    }
    quiz.setIsPublished(published);
    quizzes.flush();
    return response(quiz);
  }

  @Override
  public void delete(Long lessonId, Long quizId) {
    Quiz quiz = lockQuiz(lessonId, quizId);
    // Keep children (including unsupported legacy types) and their IDs for existing references.
    quiz.setDeletedAt(Instant.now());
  }

  @Override
  public AdminLessonQuizResponse createQuestion(Long lessonId, Long quizId, ReqQuizQuestion request) {
    Quiz quiz = lockQuiz(lessonId, quizId);
    validateRequest(request);
    if (request.options().stream().anyMatch(option -> option.id() != null)) {
      throw new BadRequestException("New question options must not have IDs");
    }
    List<QuizQuestion> current = activeQuestions(quizId);
    int lastOrder = current.stream().mapToInt(QuizQuestion::getSortOrder).max().orElse(-1);
    if (lastOrder == Integer.MAX_VALUE) {
      throw new ConflictException("Reorder questions before appending another question");
    }
    QuizQuestion question = questions.save(QuizQuestion.builder().quiz(quiz)
        .questionText(request.questionText().strip()).questionType(request.questionType())
        .sortOrder(lastOrder + 1).build());
    replaceOptions(question, request.options());
    return finish(quiz);
  }

  @Override
  public AdminLessonQuizResponse updateQuestion(Long lessonId, Long quizId, Long questionId,
      ReqQuizQuestion request) {
    Quiz quiz = lockQuiz(lessonId, quizId);
    QuizQuestion question = requireQuestion(quizId, questionId);
    requireSupported(question);
    validateRequest(request);
    replaceOptions(question, request.options());
    question.setQuestionText(request.questionText().strip());
    return finish(quiz);
  }

  @Override
  public void deleteQuestion(Long lessonId, Long quizId, Long questionId) {
    Quiz quiz = lockQuiz(lessonId, quizId);
    QuizQuestion question = requireQuestion(quizId, questionId);
    requireSupported(question);
    question.setDeletedAt(Instant.now());
    questions.flush();
    finish(quiz);
  }

  @Override
  public AdminLessonQuizResponse reorder(Long lessonId, Long quizId, List<Long> questionIds) {
    Quiz quiz = lockQuiz(lessonId, quizId);
    List<QuizQuestion> current = activeQuestions(quizId);
    Set<Long> requested = new HashSet<>(questionIds);
    Map<Long, QuizQuestion> byId = current.stream().collect(Collectors.toMap(QuizQuestion::getId, Function.identity()));
    if (requested.size() != questionIds.size() || !requested.equals(byId.keySet())) {
      throw new BadRequestException("Include every active question ID exactly once, without foreign or deleted IDs");
    }
    // Unsupported records are inspectable, but their ordering is also read-only in this phase.
    if (current.stream().anyMatch(question -> question.getQuestionType() != QuizQuestionTypeEnum.SINGLE_CHOICE)) {
      throw new ConflictException("Cannot reorder a quiz containing unsupported question types");
    }
    assignOrder(questionIds.stream().map(byId::get).toList());
    return finish(quiz);
  }

  private Lesson lockLesson(Long lessonId) {
    return lessons.findActiveForUpdate(lessonId).orElseThrow(() -> new NotFoundException("Lesson not found"));
  }

  private Quiz lockQuiz(Long lessonId, Long quizId) {
    lockLesson(lessonId);
    return single(quizzes.findActiveForUpdate(lessonId)).filter(quiz -> Objects.equals(quiz.getId(), quizId))
        .orElseThrow(() -> new NotFoundException("Quiz not found in this lesson"));
  }

  private Optional<Quiz> single(List<Quiz> active) {
    if (active.size() > 1) {
      throw new ConflictException("Multiple active quizzes exist for this lesson; an administrator must repair data");
    }
    return active.stream().findFirst();
  }

  private QuizQuestion requireQuestion(Long quizId, Long questionId) {
    return questions.findByIdAndDeletedAtIsNull(questionId)
        .filter(question -> Objects.equals(question.getQuiz().getId(), quizId))
        .orElseThrow(() -> new NotFoundException("Question not found in this quiz"));
  }

  private void requireSupported(QuizQuestion question) {
    if (question.getQuestionType() != QuizQuestionTypeEnum.SINGLE_CHOICE) {
      throw new ConflictException("This question type is read-only; only SINGLE_CHOICE authoring is supported");
    }
  }

  private void validateRequest(ReqQuizQuestion request) {
    if (request.questionType() != QuizQuestionTypeEnum.SINGLE_CHOICE) {
      throw new BadRequestException("Only SINGLE_CHOICE authoring is supported");
    }
    if (!validQuestionText(request.questionText())) {
      throw new BadRequestException("Question text must be nonblank and at most 65535 UTF-8 bytes");
    }
    if (request.options().size() < 2
        || request.options().stream().anyMatch(option -> !validText(option.optionText(), 500))
        || request.options().stream().filter(option -> Boolean.TRUE.equals(option.isCorrect())).count() != 1) {
      throw new BadRequestException(
          "SINGLE_CHOICE requires at least two nonblank options and exactly one correct option");
    }
  }

  private void replaceOptions(QuizQuestion question, List<ReqQuizQuestion.Option> requested) {
    List<QuizOption> current = options.findByQuestionIdInOrderBySortOrderAscIdAsc(List.of(question.getId()));
    Map<Long, QuizOption> byId = current.stream().collect(Collectors.toMap(QuizOption::getId, Function.identity()));
    Set<Long> retained = new HashSet<>();
    for (ReqQuizQuestion.Option input : requested) {
      if (input.id() != null && (!retained.add(input.id()) || !byId.containsKey(input.id()))) {
        throw new BadRequestException("Option IDs must be unique and belong to this question");
      }
    }
    List<QuizOption> removed = current.stream().filter(option -> !retained.contains(option.getId())).toList();
    if (optionReferences.hasReferences(removed.stream().map(QuizOption::getId).toList())) {
      throw new ConflictException("Cannot remove options referenced by existing records; retain their IDs");
    }
    options.deleteAll(removed);
    for (int index = 0; index < requested.size(); index++) {
      ReqQuizQuestion.Option input = requested.get(index);
      QuizOption option = input.id() == null ? QuizOption.builder().question(question).build() : byId.get(input.id());
      option.setOptionText(input.optionText().strip());
      option.setIsCorrect(input.isCorrect());
      option.setSortOrder(index);
      options.save(option);
    }
    options.flush();
  }

  private AdminLessonQuizResponse finish(Quiz quiz) {
    quizzes.flush();
    if (Boolean.TRUE.equals(quiz.getIsPublished())) {
      validatePublishable(quiz);
    }
    // The aggregate timestamp changes when questions/options/order change, too.
    quiz.setUpdatedAt(Instant.now());
    quizzes.flush();
    return response(quiz);
  }

  private void validatePublishable(Quiz quiz) {
    List<QuizQuestion> current = activeQuestions(quiz.getId());
    if (!validText(quiz.getTitle(), 200) || quiz.getDescription() == null
        || quiz.getDescription().length() > 500 || current.isEmpty()) {
      throw new ConflictException("Publishing requires valid metadata and at least one question; unpublish first");
    }
    Map<Long, List<QuizOption>> grouped = optionMap(current);
    for (QuizQuestion question : current) {
      List<QuizOption> answers = grouped.getOrDefault(question.getId(), List.of());
      if (question.getQuestionType() != QuizQuestionTypeEnum.SINGLE_CHOICE
          || !validQuestionText(question.getQuestionText()) || answers.size() < 2
          || answers.stream().anyMatch(option -> !validText(option.getOptionText(), 500))
          || answers.stream().filter(option -> Boolean.TRUE.equals(option.getIsCorrect())).count() != 1) {
        throw new ConflictException("Question " + question.getId()
            + " is not publishable: use SINGLE_CHOICE with two nonblank options and one correct answer;"
            + " unpublish first");
      }
    }
  }

  private boolean validText(String text, int maxLength) {
    return text != null && !text.strip().isBlank() && text.length() <= maxLength;
  }

  private boolean validQuestionText(String text) {
    return text != null && !text.strip().isBlank() && text.getBytes(StandardCharsets.UTF_8).length <= 65535;
  }

  private void assignOrder(List<QuizQuestion> ordered) {
    for (int index = 0; index < ordered.size(); index++) {
      ordered.get(index).setSortOrder(index);
    }
  }

  private List<QuizQuestion> activeQuestions(Long quizId) {
    return questions.findByQuizIdAndDeletedAtIsNullOrderBySortOrderAscIdAsc(quizId);
  }

  private Map<Long, List<QuizOption>> optionMap(List<QuizQuestion> current) {
    if (current.isEmpty()) {
      return Map.of();
    }
    return options.findByQuestionIdInOrderBySortOrderAscIdAsc(current.stream().map(QuizQuestion::getId).toList())
        .stream().collect(Collectors.groupingBy(option -> option.getQuestion().getId()));
  }

  private AdminLessonQuizResponse response(Quiz quiz) {
    List<QuizQuestion> current = activeQuestions(quiz.getId());
    return mapper.toResponse(quiz, current, optionMap(current));
  }
}
