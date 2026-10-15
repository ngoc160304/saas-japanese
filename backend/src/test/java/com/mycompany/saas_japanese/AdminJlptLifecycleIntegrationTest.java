package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptAnswerRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;
import com.mycompany.saas_japanese.util.constant.UserRoleEnum;

import jakarta.persistence.EntityManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

// H2 only. Each HTTP request commits independently; concurrency tests hold separate database transactions.
class AdminJlptLifecycleIntegrationTest extends AuthTestSupport {
  private static final String ADMIN = "/api/v1/admin/jlpt-exams/";
  private static final String CATALOG = "/api/v1/jlpt-exams";
  private static final String LEARNER = CATALOG + "/";
  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final String METADATA = "{\"level\":\"N3\",\"title\":\"Edited lifecycle exam\"}";

  @Autowired private WebApplicationContext context;
  @Autowired private PlatformTransactionManager transactions;
  @Autowired private EntityManager entityManager;
  @Autowired private JlptExamRepository exams;
  @Autowired private JlptExamSessionRepository sessions;
  @Autowired private JlptExamPartRepository parts;
  @Autowired private JlptExamQuestionRepository questions;
  @Autowired private JlptExamAnswerRepository answers;
  @Autowired private UserJlptAttemptRepository attempts;
  @Autowired private UserJlptAttemptAnswerRepository attemptAnswers;
  @Autowired private UserRepository users;
  @Autowired private MediaRepository media;
  private final List<Long> examIds = new ArrayList<>();
  private final List<Long> mediaIds = new ArrayList<>();
  private final List<Long> userIds = new ArrayList<>();
  private MockMvc mvc;

  @BeforeEach
  void prepareLifecycleTest() {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  @AfterEach
  void removeOwnFixtures() {
    tx(() -> {
      var ownAttempts = attempts.findAll().stream()
          .filter(attempt -> examIds.contains(attempt.getJlptExam().getId())).toList();
      ownAttempts.forEach(attempt -> attemptAnswers.deleteAll(
          attemptAnswers.findBySessionAttemptAttemptId(attempt.getId())));
      attemptAnswers.flush();
      attempts.deleteAll(ownAttempts);
      attempts.flush();
      for (Long id : examIds) {
        List<JlptExamSession> children = sessions.findByJlptExamIdOrderBySortOrderAscIdAsc(id);
        List<JlptExamPart> examParts = children.isEmpty() ? List.of()
            : parts.findAdminPartsBySessionIds(children.stream().map(JlptExamSession::getId).toList());
        List<JlptExamQuestion> examQuestions = examParts.isEmpty() ? List.of()
            : questions.findAdminQuestionsByPartIds(examParts.stream().map(JlptExamPart::getId).toList());
        if (!examQuestions.isEmpty()) {
          answers.deleteAll(answers.findAdminAnswersByQuestionIds(
              examQuestions.stream().map(JlptExamQuestion::getId).toList()));
          answers.flush();
        }
        exams.findById(id).ifPresent(exams::delete);
        exams.flush();
      }
      media.deleteAllById(mediaIds);
      users.deleteAllById(userIds);
      return null;
    });
  }

  @Test
  void readinessCollectsLocatedIssuesAndBothInspectionAndFailedPublishLeaveAllRowsUnchanged() throws Exception {
    Fixture fixture = fixture();
    tx(() -> {
      sessions.findById(fixture.session()).orElseThrow().setTimeLimitMinutes(0);
      parts.findById(fixture.part()).orElseThrow().setName(" ");
      JlptExamQuestion question = questions.findById(fixture.question()).orElseThrow();
      question.setQuestionText("<p>&nbsp;</p>");
      question.setPoints(BigDecimal.ZERO);
      question.setImageMediaId(Long.MAX_VALUE);
      answers.findById(fixture.correct()).orElseThrow().setSortOrder(7);
      JlptExamAnswer wrong = answers.findById(fixture.wrong()).orElseThrow();
      wrong.setAnswerText(" ");
      wrong.setIsCorrect(true);
      media.findById(fixture.audio()).orElseThrow().setFileType(FileTypeEnum.IMAGE);
      media.findById(fixture.image()).orElseThrow().setIsUsed(false);
      return null;
    });
    List<String> before = snapshot(fixture);
    JsonNode report = admin(get(ADMIN + fixture.exam() + "/validation"), 200);
    assertThat(report.get("canPublish").asBoolean()).isFalse();
    assertThat(report.get("contentValid").asBoolean()).isFalse();
    assertThat(codes(report)).contains("TEXT_REQUIRED", "QUESTION_POINTS_INVALID", "SORT_ORDER_INVALID",
        "SESSION_DURATION_INVALID", "CORRECT_ANSWER_COUNT", "MEDIA_UNAVAILABLE", "MEDIA_TYPE_INVALID");
    for (JsonNode issue : report.get("issues")) {
      assertThat(issue.get("message").asText()).isNotBlank();
      assertThat(issue.get("path").asText()).startsWith("sessions[" + fixture.session() + "]");
      assertThat(issue.get("category").asText()).isEqualTo("CONTENT");
      assertThat(issue.get("resourceIds").get("examId").asLong()).isEqualTo(fixture.exam());
    }
    assertThat(snapshot(fixture)).isEqualTo(before);
    JsonNode error = admin(post(ADMIN + fixture.exam() + "/publish"), 400);
    assertThat(error.get("status").asInt()).isEqualTo(400);
    assertThat(error.get("message").asText()).isEqualTo("JLPT exam is not ready for publication");
    assertThat(error.get("fieldErrors").isObject()).isTrue();
    assertThat(error.get("timestamp").asText()).isNotBlank();
    assertThat(error.get("issues")).isEqualTo(report.get("issues"));
    assertThat(snapshot(fixture)).isEqualTo(before);
    assertThat(exams.findById(fixture.exam()).orElseThrow().getIsPublished()).isFalse();
    assertThat(exams.findById(fixture.exam()).orElseThrow().getTotalTimeMinutes()).isEqualTo(999);
  }

  @ParameterizedTest
  @CsvSource({
      "sessionOrder,SORT_ORDER_INVALID", "partOrder,SORT_ORDER_INVALID", "questionOrder,SORT_ORDER_INVALID",
      "answerOrder,SORT_ORDER_INVALID", "duration,SESSION_DURATION_INVALID", "points,QUESTION_POINTS_INVALID",
      "blankAnswer,TEXT_REQUIRED", "noCorrect,CORRECT_ANSWER_COUNT", "manyCorrect,CORRECT_ANSWER_COUNT",
      "deletedImage,MEDIA_UNAVAILABLE", "wrongImage,MEDIA_TYPE_INVALID", "deletedAudio,MEDIA_UNAVAILABLE",
      "missingAudio,MEDIA_UNAVAILABLE", "fewAnswers,ANSWERS_TOO_FEW", "emptyPart,COLLECTION_EMPTY",
      "emptySession,COLLECTION_EMPTY", "blankTitle,TEXT_REQUIRED", "blankSession,TEXT_REQUIRED",
      "longPassage,TEXT_TOO_LONG", "longExplanation,TEXT_TOO_LONG", "longInstructions,TEXT_TOO_LONG"
  })
  void legacyPersistedDefectsBlockPublicationWithoutRepairingData(String defect, String code) throws Exception {
    Fixture fixture = fixture();
    tx(() -> {
      switch (defect) {
        case "sessionOrder" -> sessions.findById(fixture.session()).orElseThrow().setSortOrder(3);
        case "partOrder" -> parts.findById(fixture.part()).orElseThrow().setSortOrder(-1);
        case "questionOrder" -> questions.findById(fixture.question()).orElseThrow().setSortOrder(2);
        case "answerOrder" -> answers.findById(fixture.wrong()).orElseThrow().setSortOrder(0);
        case "duration" -> sessions.findById(fixture.session()).orElseThrow().setTimeLimitMinutes(181);
        case "points" -> questions.findById(fixture.question()).orElseThrow().setPoints(BigDecimal.ZERO);
        case "blankAnswer" -> answers.findById(fixture.wrong()).orElseThrow().setAnswerText("<br>");
        case "noCorrect" -> answers.findById(fixture.correct()).orElseThrow().setIsCorrect(false);
        case "manyCorrect" -> answers.findById(fixture.wrong()).orElseThrow().setIsCorrect(true);
        case "deletedImage" -> media.findById(fixture.image()).orElseThrow().setIsDeleted(true);
        case "wrongImage" -> media.findById(fixture.image()).orElseThrow().setFileType(FileTypeEnum.VIDEO);
        case "deletedAudio" -> media.findById(fixture.audio()).orElseThrow().setIsDeleted(true);
        case "missingAudio" -> parts.findById(fixture.part()).orElseThrow().setAudioMediaId(Long.MAX_VALUE);
        case "fewAnswers" -> answers.deleteById(fixture.wrong());
        case "emptyPart" -> parts.save(JlptExamPart.builder().jlptExamSession(sessions.getReferenceById(
            fixture.session())).name("Empty part").sortOrder(1).build());
        case "emptySession" -> sessions.save(JlptExamSession.builder().jlptExam(exams.getReferenceById(
            fixture.exam())).name("Empty session").sessionType(JlptSessionEnum.listening)
            .timeLimitMinutes(5).sortOrder(1).build());
        case "blankTitle" -> exams.findById(fixture.exam()).orElseThrow().setTitle(" ");
        case "blankSession" -> sessions.findById(fixture.session()).orElseThrow().setName(" ");
        case "longPassage" -> questions.findById(fixture.question()).orElseThrow().setPassageText("x".repeat(50001));
        case "longExplanation" -> questions.findById(fixture.question()).orElseThrow()
            .setExplanation("x".repeat(20001));
        case "longInstructions" -> parts.findById(fixture.part()).orElseThrow().setInstructions("x".repeat(10001));
        default -> throw new IllegalArgumentException(defect);
      }
      return null;
    });
    List<String> before = snapshot(fixture);
    assertThat(codes(admin(get(ADMIN + fixture.exam() + "/validation"), 200))).contains(code);
    assertThat(codes(admin(post(ADMIN + fixture.exam() + "/publish"), 400))).contains(code);
    assertThat(snapshot(fixture)).isEqualTo(before);
  }

  @Test
  void emptyExamIsNotReadyAndUnknownOrInvalidIdsUseExistingErrors() throws Exception {
    JlptExam exam = exams.save(JlptExam.builder().title("Empty").jlptLevel(JlptLevelEnum.N5).build());
    examIds.add(exam.getId());
    assertThat(codes(admin(get(ADMIN + exam.getId() + "/validation"), 200))).containsExactly("COLLECTION_EMPTY");
    admin(post(ADMIN + exam.getId() + "/publish"), 400);
    admin(get(ADMIN + Long.MAX_VALUE + "/validation"), 404);
    admin(get(ADMIN + "0/validation"), 400);
    admin(get(ADMIN + "bad/validation"), 400);
  }

  @Test
  void validPublicationDerivesDurationAndRepeatedLifecycleRequestsKeepExistingSemantics() throws Exception {
    Fixture fixture = fixture();
    tx(() -> {
      // Media is optional, including listening audio; only attached references must be valid.
      sessions.findById(fixture.session()).orElseThrow().setSessionType(JlptSessionEnum.listening);
      parts.findById(fixture.part()).orElseThrow().setAudioMediaId(null);
      return null;
    });
    List<String> before = snapshot(fixture);
    JsonNode report = admin(get(ADMIN + fixture.exam() + "/validation"), 200);
    assertThat(report.get("contentValid").asBoolean()).isTrue();
    assertThat(report.get("canPublish").asBoolean()).isTrue();
    assertThat(report.get("totalTimeMinutes").asInt()).isEqualTo(30);
    assertThat(report.get("issues").isEmpty()).isTrue();
    assertThat(snapshot(fixture)).isEqualTo(before);
    for (int index = 0; index < 2; index++) {
      assertThat(admin(post(ADMIN + fixture.exam() + "/publish"), 200).get("status").asText()).isEqualTo("PUBLISHED");
    }
    assertThat(exams.findById(fixture.exam()).orElseThrow().getTotalTimeMinutes()).isEqualTo(30);
    assertThat(admin(get(ADMIN + fixture.exam() + "/validation"), 200).get("canPublish").asBoolean()).isTrue();
    admin(put(ADMIN + fixture.exam()).content(METADATA), 409);
    for (int index = 0; index < 2; index++) {
      assertThat(admin(post(ADMIN + fixture.exam() + "/unpublish"), 200).get("status").asText()).isEqualTo("DRAFT");
    }
    admin(delete(ADMIN + fixture.exam()), 204);
    List<String> archived = snapshot(fixture);
    JsonNode archivedReport = admin(get(ADMIN + fixture.exam() + "/validation"), 200);
    assertThat(archivedReport.get("canPublish").asBoolean()).isFalse();
    assertThat(archivedReport.get("contentValid").asBoolean()).isTrue();
    assertThat(codes(archivedReport)).containsExactly("EXAM_ARCHIVED");
    assertThat(archivedReport.get("issues").get(0).get("category").asText()).isEqualTo("LIFECYCLE");
    admin(post(ADMIN + fixture.exam() + "/publish"), 404);
    admin(post(ADMIN + fixture.exam() + "/unpublish"), 404);
    admin(delete(ADMIN + fixture.exam()), 404);
    admin(put(ADMIN + fixture.exam()).content(METADATA), 404);
    assertThat(snapshot(fixture)).isEqualTo(archived);
  }

  @ParameterizedTest
  @ValueSource(strings = {"unpublish", "archive"})
  void transitionsBlockNewAttemptsButPreserveInProgressWorkResultsReviewAndMedia(String transition) throws Exception {
    Fixture fixture = fixture();
    User learner = learner();
    assertHidden(fixture, learner);
    admin(post(ADMIN + fixture.exam() + "/publish"), 200);
    for (String path : List.of("", fixture.exam() + "", fixture.exam() + "/detail",
        fixture.exam() + "/sessions/" + fixture.session())) {
      assertNoSolutions(student(get(path.isEmpty() ? CATALOG : LEARNER + path), learner, 200));
    }
    JsonNode started = student(start(fixture, learner), learner, 200);
    assertNoSolutions(started);
    long attemptId = started.get("attemptId").asLong();
    long attemptSessionId = started.get("sessions").get(0).get("attemptSessionId").asLong();
    student(get(LEARNER + "attempts/" + attemptId + "/review"), learner, 400);
    student(get(LEARNER + "attempts/" + attemptId + "/result"), learner, 400);
    if (transition.equals("archive")) {
      admin(delete(ADMIN + fixture.exam()), 204);
    } else {
      admin(post(ADMIN + fixture.exam() + "/unpublish"), 200);
    }
    assertHidden(fixture, learner);
    assertThat(attempts.findAll().stream().filter(a -> a.getJlptExam().getId().equals(fixture.exam())).count())
        .isEqualTo(1);
    admin(put(ADMIN + fixture.exam()).content(METADATA), transition.equals("archive") ? 404 : 409);
    JsonNode report = admin(get(ADMIN + fixture.exam() + "/validation"), 200);
    assertThat(report.get("hasAttempts").asBoolean()).isTrue();
    assertThat(report.get("contentLocked").asBoolean()).isTrue();
    assertThat(report.get("canPublish").asBoolean()).isEqualTo(transition.equals("unpublish"));
    String answerPath = LEARNER + "attempts/" + attemptId + "/sessions/" + attemptSessionId + "/answers";
    assertNoSolutions(student(put(answerPath).content("{\"questionId\":" + fixture.question()
        + ",\"answerId\":" + fixture.correct() + "}"), learner, 200));
    student(post(LEARNER + "attempts/" + attemptId + "/submit"), learner, 200);
    JsonNode result = student(get(LEARNER + "attempts/" + attemptId + "/result"), learner, 200);
    JsonNode review = student(get(LEARNER + "attempts/" + attemptId + "/review"), learner, 200);
    assertThat(result.get("correctCount").asInt()).isEqualTo(1);
    JsonNode reviewedQuestion = review.get("sessions").get(0).get("parts").get(0).get("questions").get(0);
    assertThat(reviewedQuestion.get("explanation").asText()).isEqualTo("Explanation");
    assertThat(reviewedQuestion.get("correctAnswerId").asLong()).isEqualTo(fixture.correct());
    assertThat(reviewedQuestion.get("isCorrect").asBoolean()).isTrue();
    assertThat(student(get(LEARNER + "attempts/history"), learner, 200).get("totalElements").asInt()).isEqualTo(1);
    student(get(LEARNER + "attempts/" + attemptId + "/review"), learner(), 403);
    if (transition.equals("unpublish")) {
      admin(post(ADMIN + fixture.exam() + "/publish"), 200);
      admin(post(ADMIN + fixture.exam() + "/unpublish"), 200);
      admin(delete(ADMIN + fixture.exam()), 204);
    }
    assertThat(student(get(LEARNER + "attempts/" + attemptId + "/result"), learner, 200)).isEqualTo(result);
    assertThat(student(get(LEARNER + "attempts/" + attemptId + "/review"), learner, 200)).isEqualTo(review);
    assertThat(answers.findById(fixture.correct())).isPresent();
    assertThat(questions.findById(fixture.question())).isPresent();
    for (Long id : List.of(fixture.audio(), fixture.image())) {
      Media stored = media.findById(id).orElseThrow();
      assertThat(stored.getIsUsed()).isTrue();
      assertThat(stored.getIsDeleted()).isFalse();
    }
  }

  @Test
  void readinessRequiresAdmin() throws Exception {
    Fixture fixture = fixture();
    List<String> before = snapshot(fixture);
    mvc.perform(get(ADMIN + fixture.exam() + "/validation")).andExpect(status().isUnauthorized());
    student(get(ADMIN + fixture.exam() + "/validation"), learner(), 403);
    admin(get(ADMIN + fixture.exam() + "/validation"), 200);
    assertThat(snapshot(fixture)).isEqualTo(before);
  }

  @ParameterizedTest
  @CsvSource({"publish,edit,409", "edit,publish,200", "changeAnswers,publish,400",
      "unpublish,start,404", "archive,start,404",
      "start,unpublish,200", "start,archive,204", "startAndUnpublish,edit,409", "editAndPublish,start,200"})
  void rootLockSerializesLifecycleEditingAndFirstAttempt(String firstAction, String secondAction, int expected)
      throws Exception {
    Fixture fixture = fixture();
    User learner = learner();
    if (List.of("unpublish", "archive", "start", "startAndUnpublish").contains(firstAction)) {
      admin(post(ADMIN + fixture.exam() + "/publish"), 200);
    }
    CountDownLatch locked = new CountDownLatch(1);
    CountDownLatch release = new CountDownLatch(1);
    CountDownLatch started = new CountDownLatch(1);
    var executor = Executors.newFixedThreadPool(2);
    try {
      var first = executor.submit(() -> tx(() -> {
        exams.findActiveForUpdate(fixture.exam()).orElseThrow();
        performAction(firstAction, fixture, learner, firstAction.equals("archive") ? 204 : 200);
        locked.countDown();
        await(release);
        return null;
      }));
      assertThat(locked.await(15, TimeUnit.SECONDS)).isTrue();
      var second = executor.submit(() -> {
        started.countDown();
        return performAction(secondAction, fixture, learner, expected);
      });
      assertThat(started.await(10, TimeUnit.SECONDS)).isTrue();
      assertThatThrownBy(() -> second.get(250, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
      release.countDown();
      first.get(15, TimeUnit.SECONDS);
      JsonNode response = second.get(15, TimeUnit.SECONDS);
      long attemptCount = attempts.findAll().stream()
          .filter(a -> a.getJlptExam().getId().equals(fixture.exam())).count();
      boolean attemptExpected = firstAction.startsWith("start") || (secondAction.equals("start") && expected == 200);
      assertThat(attemptCount).isEqualTo(attemptExpected ? 1 : 0);
      JlptExam stored = exams.findById(fixture.exam()).orElseThrow();
      if (firstAction.equals("changeAnswers")) {
        assertThat(stored.getIsPublished()).isFalse();
        assertThat(answers.findById(fixture.wrong()).orElseThrow().getIsCorrect()).isTrue();
        assertThat(codes(response)).contains("CORRECT_ANSWER_COUNT");
      } else if (firstAction.equals("publish")) {
        assertThat(stored.getTitle()).isEqualTo(fixture.title());
        assertThat(stored.getIsPublished()).isTrue();
      } else if (firstAction.startsWith("edit")) {
        assertThat(stored.getTitle()).isEqualTo("Edited lifecycle exam");
        assertThat(stored.getIsPublished()).isTrue();
        if (secondAction.equals("start")) {
          assertThat(response.get("examTitle").asText()).isEqualTo(stored.getTitle());
        }
      } else {
        assertThat(stored.getIsPublished()).isFalse();
      }
    } finally {
      release.countDown();
      executor.shutdownNow();
      assertThat(executor.awaitTermination(15, TimeUnit.SECONDS)).isTrue();
    }
  }

  private JsonNode performAction(String action, Fixture fixture, User learner, int expected) {
    try {
      return switch (action) {
        case "edit" -> admin(put(ADMIN + fixture.exam()).content(METADATA), expected);
        case "changeAnswers" -> admin(put(ADMIN + fixture.exam() + "/sessions/" + fixture.session()
            + "/parts/" + fixture.part() + "/questions/" + fixture.question() + "/answers/" + fixture.wrong())
            .content("{\"answerText\":\"Changed\",\"isCorrect\":true,\"sortOrder\":1}"), expected);
        case "start" -> student(start(fixture, learner), learner, expected);
        case "archive" -> admin(delete(ADMIN + fixture.exam()), expected);
        case "startAndUnpublish" -> {
          student(start(fixture, learner), learner, 200);
          yield admin(post(ADMIN + fixture.exam() + "/unpublish"), expected);
        }
        case "editAndPublish" -> {
          admin(put(ADMIN + fixture.exam()).content(METADATA), 200);
          yield admin(post(ADMIN + fixture.exam() + "/publish"), expected);
        }
        default -> admin(post(ADMIN + fixture.exam() + "/" + action), expected);
      };
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }

  private void assertHidden(Fixture fixture, User learner) throws Exception {
    for (String suffix : List.of("", "/detail", "/sessions/" + fixture.session())) {
      student(get(LEARNER + fixture.exam() + suffix), learner, 404);
    }
    JsonNode catalog = student(get(CATALOG).param("search", fixture.title()), learner, 200);
    assertThat(catalog.get("totalElements").asInt()).isZero();
    student(start(fixture, learner), learner, 404);
  }

  private void assertNoSolutions(JsonNode response) {
    assertThat(response.findValues("isCorrect")).isEmpty();
    assertThat(response.findValues("correctAnswerId")).isEmpty();
    assertThat(response.findValues("explanation")).isEmpty();
    assertThat(response.toString()).doesNotContain("Explanation");
  }

  private MockHttpServletRequestBuilder start(Fixture fixture, User learner) {
    return post(LEARNER + fixture.exam() + "/attempts")
        .content("{\"mode\":\"full\",\"userId\":" + learner.getId() + "}");
  }

  private Fixture fixture() {
    return tx(() -> {
      Media audio = newMedia(FileTypeEnum.AUDIO);
      Media image = newMedia(FileTypeEnum.IMAGE);
      String title = "Lifecycle " + UUID.randomUUID();
      JlptExam exam = exams.save(JlptExam.builder().title(title).jlptLevel(JlptLevelEnum.N3)
          .totalTimeMinutes(999).build());
      examIds.add(exam.getId());
      JlptExamSession session = sessions.save(JlptExamSession.builder().jlptExam(exam).name("Reading")
          .sessionType(JlptSessionEnum.reading).timeLimitMinutes(30).sortOrder(0).build());
      JlptExamPart part = parts.save(JlptExamPart.builder().jlptExamSession(session).name("Part")
          .sortOrder(0).audioMediaId(audio.getId()).build());
      JlptExamQuestion question = questions.save(JlptExamQuestion.builder().jlptExamPart(part)
          .questionText("<strong>Question</strong>").questionType(JlptQuestionEnum.single_choice)
          .points(BigDecimal.ONE).sortOrder(0).imageMediaId(image.getId()).explanation("Explanation").build());
      JlptExamAnswer correct = answers.save(JlptExamAnswer.builder().jlptExamQuestion(question)
          .answerText("Correct").isCorrect(true).sortOrder(0).build());
      JlptExamAnswer wrong = answers.save(JlptExamAnswer.builder().jlptExamQuestion(question)
          .answerText("Wrong").isCorrect(false).sortOrder(1).build());
      return new Fixture(exam.getId(), session.getId(), part.getId(), question.getId(), correct.getId(),
          wrong.getId(), image.getId(), audio.getId(), title);
    });
  }

  private Media newMedia(FileTypeEnum type) {
    Media result = media.save(Media.builder().fileName("lifecycle").publicId(UUID.randomUUID().toString())
        .secureUrl("https://example.test/media").fileType(type).isUsed(true).build());
    mediaIds.add(result.getId());
    return result;
  }

  private User learner() {
    User user = new User();
    user.setEmail(UUID.randomUUID() + "@example.test");
    user.setUsername(user.getEmail());
    user.setPassword("hash");
    user.setRole(UserRoleEnum.student);
    user.setActive(true);
    user.setVerified(true);
    user = users.save(user);
    userIds.add(user.getId());
    return user;
  }

  private List<String> snapshot(Fixture fixture) {
    return tx(() -> {
      List<String> result = new ArrayList<>();
      for (String query : List.of(
          "select e.id,e.title,e.description,e.jlptLevel,e.totalTimeMinutes,e.isPublished,e.isDeleted,"
              + "e.createdAt,e.updatedAt,e.deletedAt from JlptExam e where e.id = :id",
          "select s.id,s.name,s.sessionType,s.timeLimitMinutes,s.sortOrder,s.createdAt,s.updatedAt"
              + " from JlptExamSession s where s.jlptExam.id = :id order by s.id",
          "select p.id,p.name,p.instructions,p.sortOrder,p.audioMediaId,p.createdAt,p.updatedAt"
              + " from JlptExamPart p where p.jlptExamSession.jlptExam.id = :id order by p.id",
          "select q.id,q.questionText,q.passageText,q.questionType,q.explanation,q.points,q.sortOrder,"
              + "q.imageMediaId,q.createdAt,q.updatedAt from JlptExamQuestion q"
              + " where q.jlptExamPart.jlptExamSession.jlptExam.id = :id order by q.id",
          "select a.id,a.answerText,a.isCorrect,a.sortOrder,a.createdAt,a.updatedAt from JlptExamAnswer a"
              + " where a.jlptExamQuestion.jlptExamPart.jlptExamSession.jlptExam.id = :id order by a.id")) {
        for (Object[] row : entityManager.createQuery(query, Object[].class)
            .setParameter("id", fixture.exam()).getResultList()) {
          result.add(Arrays.deepToString(row));
        }
      }
      for (Long id : List.of(fixture.image(), fixture.audio())) {
        Media value = media.findById(id).orElseThrow();
        result.add(id + ":" + value.getIsUsed() + ":" + value.getIsDeleted() + ":" + value.getFileType()
            + ":" + value.getUpdatedAt());
      }
      return result;
    });
  }

  private List<String> codes(JsonNode response) {
    List<String> result = new ArrayList<>();
    response.get("issues").forEach(issue -> result.add(issue.get("code").asText()));
    return result;
  }

  private JsonNode admin(MockHttpServletRequestBuilder request, int expected) throws Exception {
    return response(request.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))), expected);
  }

  private JsonNode student(MockHttpServletRequestBuilder request, User learner, int expected) throws Exception {
    return response(request.with(jwt().jwt(token -> token.subject(learner.getEmail()))
        .authorities(new SimpleGrantedAuthority("ROLE_USER"))), expected);
  }

  private JsonNode response(MockHttpServletRequestBuilder request, int expected) throws Exception {
    String body = mvc.perform(request.contentType(MediaType.APPLICATION_JSON)).andExpect(status().is(expected))
        .andReturn().getResponse().getContentAsString();
    return expected == 204 ? null : expected >= 400 ? JSON.readTree(body) : JSON.readTree(body).get("data");
  }

  private <T> T tx(Supplier<T> work) {
    return new TransactionTemplate(transactions).execute(transaction -> work.get());
  }

  private void await(CountDownLatch latch) {
    try {
      if (!latch.await(15, TimeUnit.SECONDS)) {
        throw new IllegalStateException("Timed out waiting for lifecycle transaction");
      }
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException(exception);
    }
  }

  private record Fixture(long exam, long session, long part, long question, long correct, long wrong,
      long image, long audio, String title) { }
}
