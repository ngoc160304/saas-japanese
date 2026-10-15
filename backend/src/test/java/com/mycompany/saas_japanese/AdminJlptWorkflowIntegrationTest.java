package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptAnswerRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.util.constant.UserRoleEnum;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

// Real HTTP/service transactions against disposable H2 data; Cloudinary never leaves the process.
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:jlpt-workflow;MODE=MySQL;DB_CLOSE_DELAY=-1")
class AdminJlptWorkflowIntegrationTest extends AuthTestSupport {
  private static final String ADMIN = "/api/v1/admin/jlpt-exams";
  private static final String LEARNER = "/api/v1/jlpt-exams";
  private static final JsonMapper JSON = JsonMapper.builder().build();
  @Autowired private WebApplicationContext context;
  @Autowired private PlatformTransactionManager transactions;
  @Autowired private JlptExamRepository exams;
  @Autowired private JlptExamPartRepository parts;
  @Autowired private JlptExamQuestionRepository questions;
  @Autowired private JlptExamAnswerRepository answers;
  @Autowired private MediaRepository media;
  @Autowired private UserRepository users;
  @Autowired private UserJlptAttemptRepository attempts;
  @Autowired private UserJlptAttemptAnswerRepository attemptAnswers;
  @MockitoBean private Cloudinary cloudinary;
  private final List<Long> mediaIds = new ArrayList<>();
  private final List<Long> userIds = new ArrayList<>();
  private MockMvc mvc;
  private Long examId;

  @BeforeEach
  void prepareWorkflow() throws IOException {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    Uploader uploader = mock(Uploader.class);
    when(cloudinary.uploader()).thenReturn(uploader);
    when(uploader.upload(any(), anyMap())).thenAnswer(invocation -> Map.of(
        "public_id", "workflow/" + UUID.randomUUID(), "secure_url", "https://example.test/workflow-media"));
  }

  @AfterEach
  void removeWorkflowData() {
    Long cleanupExamId = examId;
    new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
      if (cleanupExamId != null) {
        var ownAttempts = attempts.findAll().stream()
            .filter(attempt -> cleanupExamId.equals(attempt.getJlptExam().getId())).toList();
        ownAttempts.forEach(attempt -> attemptAnswers.deleteAll(
            attemptAnswers.findBySessionAttemptAttemptId(attempt.getId())));
        attemptAnswers.flush();
        attempts.deleteAll(ownAttempts);
        attempts.flush();
        var ownQuestions = questions.findAll().stream()
            .filter(question -> cleanupExamId.equals(
                question.getJlptExamPart().getJlptExamSession().getJlptExam().getId()))
            .toList();
        if (!ownQuestions.isEmpty()) {
          answers.deleteAll(answers.findAdminAnswersByQuestionIds(ownQuestions.stream().map(q -> q.getId()).toList()));
          answers.flush();
        }
        exams.deleteById(cleanupExamId);
        exams.flush();
      }
      media.deleteAllById(mediaIds);
      users.deleteAllById(userIds);
    });
  }

  @ParameterizedTest
  @CsvSource(value = {"page|-1", "page|''", "page|bad", "size|0", "size|-1", "size|13", "size|''"},
      delimiter = '|', emptyValue = "")
  void learnerCatalogRejectsInvalidPagination(String parameter, String value) throws Exception {
    JsonNode error = student(get(LEARNER).param(parameter, value), learner(), 400);
    assertThat(error.get("status").asInt()).isEqualTo(400);
    assertThat(exams.count()).isZero();
  }

  @Test
  void authorPublishTakeAndArchiveAnExamWithoutLosingContentOrHistory() throws Exception {
    User owner = learner();
    User other = learner();
    String title = "Workflow " + UUID.randomUUID();
    JsonNode created = admin(post(ADMIN).content("{\"level\":\"N3\",\"title\":\" " + title + " \"}"), 201);
    examId = created.get("id").asLong();
    String exam = ADMIN + "/" + examId;
    assertThat(created.get("status").asText()).isEqualTo("DRAFT");
    assertThat(created.get("totalTimeMinutes").asInt()).isZero();
    admin(put(exam).content("{\"level\":\"N3\",\"title\":\"" + title + "\",\"description\":\"日本語\"}"), 200);
    JsonNode notReady = admin(get(exam + "/validation"), 200);
    assertThat(notReady.get("canPublish").asBoolean()).isFalse();
    assertThat(notReady.get("issues").get(0).get("path").asText()).isEqualTo("sessions");
    admin(post(exam + "/publish"), 400);
    assertThat(exams.findById(examId).orElseThrow().getIsPublished()).isFalse();

    long image = upload("images", "question.png", "image/png", Base64.getDecoder().decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG1kAAAAASUVORK5CYII="));
    long audio = upload("audios", "listening.wav", "audio/wav", AudioTestFiles.wav());
    String knowledge = createSession(exam, "language_knowledge", 10, 0);
    String reading = createSession(exam, "reading", 20, 1);
    String listening = createSession(exam, "listening", 30, 2);
    String kPart = createPart(knowledge, 0, null);
    String rPart = createPart(reading, 0, null);
    String rPart2 = createPart(reading, 1, null);
    String lPart = createPart(listening, 0, audio);
    List<String> questionPaths = new ArrayList<>();
    questionPaths.add(createQuestion(kPart, 0, null));
    questionPaths.add(createQuestion(rPart, 0, image));
    questionPaths.add(createQuestion(rPart, 1, null));
    questionPaths.add(createQuestion(rPart2, 0, null));
    questionPaths.add(createQuestion(lPart, 0, null));

    String editedPath = questionPaths.get(1);
    JsonNode original = admin(get(editedPath), 200);
    long retained = original.get("answers").get(0).get("id").asLong();
    long removed = original.get("answers").get(1).get("id").asLong();
    ObjectNode edit = questionBody(0, image);
    ObjectNode firstAnswer = (ObjectNode) edit.get("answers").get(0);
    firstAnswer.put("id", retained).put("answerText", "Retained 日本語").put("isCorrect", false);
    ((ObjectNode) edit.get("answers").get(1)).put("isCorrect", true);
    JsonNode saved = admin(put(editedPath + "/with-answers").content(JSON.writeValueAsString(edit)), 200);
    long added = saved.get("answers").get(1).get("id").asLong();
    assertThat(saved.get("id")).isEqualTo(original.get("id"));
    assertThat(saved.get("answers").get(0).get("id").asLong()).isEqualTo(retained);
    assertThat(added).isNotIn(retained, removed);
    assertThat(answers.findById(removed)).isEmpty();
    assertThat(answers.findById(retained).orElseThrow().getAnswerText()).isEqualTo("Retained 日本語");
    reorder(editedPath + "/answers", List.of(added, retained));
    reorder(rPart + "/questions", List.of(id(questionPaths.get(2)), id(editedPath)));
    reorder(reading + "/parts", List.of(id(rPart2), id(rPart)));
    reorder(exam + "/sessions", List.of(id(listening), id(reading), id(knowledge)));

    // Rejected stale/foreign IDs must preserve the complete stored representation and media flags.
    JsonNode before = admin(get(exam), 200);
    admin(patch(rPart + "/questions/reorder").content("{\"ids\":[]}"), 400);
    firstAnswer.put("id", removed);
    admin(put(editedPath + "/with-answers").content(JSON.writeValueAsString(edit)), 400);
    assertThat(admin(get(exam), 200)).isEqualTo(before);
    assertThat(questions.findById(id(editedPath)).orElseThrow().getImageMediaId()).isEqualTo(image);
    assertThat(parts.findById(id(lPart)).orElseThrow().getAudioMediaId()).isEqualTo(audio);
    assertMediaUsed(image, audio);

    assertThat(before.get("sessionCount").asInt()).isEqualTo(3);
    assertThat(before.get("partCount").asInt()).isEqualTo(4);
    assertThat(before.get("questionCount").asInt()).isEqualTo(5);
    assertThat(before.get("totalTimeMinutes").asInt()).isEqualTo(60);
    assertThat(exams.findById(examId).orElseThrow().getTotalTimeMinutes()).isEqualTo(60);
    assertThat(before.get("passingScore").asInt()).isEqualTo(95);
    assertThat(before.get("contentLocked").asBoolean()).isFalse();
    JsonNode page = admin(get(ADMIN).param("search", title).param("level", "N3").param("size", "1"), 200);
    assertThat(page.get("totalElements").asInt()).isEqualTo(1);
    assertThat(page.get("content").get(0).get("questionCount").asInt()).isEqualTo(5);
    assertStats(title, 1, 0, 0);
    JsonNode ready = admin(get(exam + "/validation"), 200);
    assertThat(ready.get("canPublish").asBoolean()).isTrue();
    assertThat(ready.get("issues").isEmpty()).isTrue();
    assertThat(admin(get(exam), 200)).isEqualTo(before);
    admin(post(exam + "/publish"), 200);
    assertStats(title, 0, 1, 0);
    for (String path : List.of(LEARNER + "?search=" + title, LEARNER + "/" + examId,
        LEARNER + "/" + examId + "/detail")) {
      assertNoSolutions(student(get(path.replace(" ", "%20")), owner, 200));
    }
    long attemptCount = attempts.count();
    for (String input : List.of("{\"mode\":\"invalid\"}", "{\"mode\":\"session\"}",
        "{\"mode\":\"full\",\"sessionId\":1}")) {
      ObjectNode invalid = (ObjectNode) JSON.readTree(input);
      invalid.put("userId", owner.getId());
      student(post(LEARNER + "/" + examId + "/attempts").content(JSON.writeValueAsString(invalid)), owner, 400);
    }
    student(post(LEARNER + "/" + examId + "/attempts").content("{\"userId\":" + owner.getId()
        + ",\"mode\":\"session\",\"sessionId\":9223372036854775807}"), owner, 404);
    student(start(owner), other, 403);
    assertThat(attempts.count()).isEqualTo(attemptCount);
    JsonNode attempt = student(start(owner), owner, 200);
    JsonNode inProgress = student(start(other), other, 200);
    assertNoSolutions(attempt);
    assertNoSolutions(inProgress);
    String attemptPath = LEARNER + "/attempts/" + attempt.get("attemptId").asLong();
    student(get(attemptPath + "/result"), owner, 400);
    student(get(attemptPath + "/review"), owner, 400);
    saveAllAnswers(attempt, owner, questionPaths);
    JsonNode submitted = student(post(attemptPath + "/submit"), owner, 200);
    assertThat(submitted.get("totalScore").asInt()).isEqualTo(150);
    assertThat(submitted.get("correctCount").asInt()).isEqualTo(5);
    JsonNode result = student(get(attemptPath + "/result"), owner, 200);
    JsonNode review = student(get(attemptPath + "/review"), owner, 200);
    assertThat(result.get("overallPassScore").asInt()).isEqualTo(95);
    assertThat(result.get("isPassed").asBoolean()).isTrue();
    assertThat(result.get("scoringSections").size()).isEqualTo(3);
    assertThat(review.toString()).contains("Explanation 日本語", "correctAnswerId");
    assertThat(student(get(LEARNER + "/attempts/history"), owner, 200)
        .get("content").get(0).get("isPassed").asBoolean()).isTrue();
    assertThat(attempts.findById(attempt.get("attemptId").asLong()).orElseThrow().getIsPassed()).isTrue();
    student(get(attemptPath + "/result"), other, 403);
    student(get(attemptPath + "/review"), other, 403);
    student(post(attemptPath + "/submit"), other, 403);
    JsonNode locked = admin(get(exam), 200);
    assertThat(locked.get("hasAttempts").asBoolean()).isTrue();
    assertThat(locked.get("contentLocked").asBoolean()).isTrue();
    admin(post(exam + "/unpublish"), 200);
    admin(put(editedPath + "/with-answers").content(JSON.writeValueAsString(questionBody(0, image))), 409);
    reorderRejected(exam, List.of(id(knowledge), id(reading), id(listening)), 409);
    student(start(owner), owner, 404);
    // This separate attempt survives both transitions, including saves between unpublish and archive.
    saveAllAnswers(inProgress, other, questionPaths);
    admin(delete(exam), 204);
    saveAllAnswers(inProgress, other, questionPaths);
    student(start(other), other, 404);
    student(get(LEARNER + "/" + examId + "/detail"), owner, 404);
    assertThat(student(get(LEARNER).param("search", title), owner, 200).get("totalElements").asInt()).isZero();
    String progressPath = LEARNER + "/attempts/" + inProgress.get("attemptId").asLong();
    student(post(progressPath + "/submit"), other, 200);
    assertThat(student(get(progressPath + "/result"), other, 200).get("isPassed").asBoolean()).isTrue();
    assertThat(student(get(attemptPath + "/result"), owner, 200)).isEqualTo(result);
    assertThat(student(get(attemptPath + "/review"), owner, 200)).isEqualTo(review);
    assertThat(attemptAnswers.count()).isEqualTo(10);
    assertThat(answers.findById(retained)).isPresent();
    assertThat(exams.findById(examId).orElseThrow().getDeletedAt()).isNotNull();
    assertStats(title, 0, 0, 1);
    JsonNode archived = admin(get(exam), 200);
    assertThat(archived.get("sessions")).isEqualTo(locked.get("sessions"));
    assertThat(archived.get("status").asText()).isEqualTo("ARCHIVED");
    assertThat(admin(get(ADMIN).param("search", title).param("status", "ARCHIVED"), 200)
        .get("totalElements").asInt()).isEqualTo(1);
    assertMediaUsed(image, audio);
  }

  private String createSession(String exam, String type, int minutes, int order) throws Exception {
    JsonNode saved = admin(post(exam + "/sessions").content("{\"name\":\"" + type + "\",\"sessionType\":\""
        + type + "\",\"timeLimitMinutes\":" + minutes + ",\"sortOrder\":" + order + "}"), 201);
    return exam + "/sessions/" + saved.get("id").asLong();
  }

  private String createPart(String session, int order, Long audio) throws Exception {
    JsonNode saved = admin(post(session + "/parts").content("{\"name\":\"Part\",\"sortOrder\":" + order
        + ",\"audioMediaId\":" + audio + "}"), 201);
    return session + "/parts/" + saved.get("id").asLong();
  }

  private String createQuestion(String part, int order, Long image) throws Exception {
    JsonNode saved = admin(post(part + "/questions/with-answers")
        .content(JSON.writeValueAsString(questionBody(order, image))), 201);
    return part + "/questions/" + saved.get("id").asLong();
  }

  private ObjectNode questionBody(int order, Long image) {
    ObjectNode body = JSON.createObjectNode().put("questionText", "<strong>問題 日本語</strong>")
        .put("passageText", "文章").put("explanation", "Explanation 日本語").put("questionType", "single_choice")
        .put("points", 30).put("sortOrder", order);
    if (image != null) {
      body.put("imageMediaId", image);
    }
    body.putArray("answers").addObject().put("answerText", "正解").put("isCorrect", true);
    body.withArray("answers").addObject().put("answerText", "不正解").put("isCorrect", false);
    return body;
  }

  private long upload(String kind, String name, String mime, byte[] bytes) throws Exception {
    String response = mvc.perform(multipart("/api/v1/upload/" + kind)
        .file(new MockMultipartFile("file", name, mime, bytes))
        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    long id = JSON.readTree(response).get("data").get("id").asLong();
    mediaIds.add(id);
    assertThat(media.findById(id).orElseThrow().getIsUsed()).isFalse();
    return id;
  }

  private void reorder(String collection, List<Long> ids) throws Exception {
    JsonNode saved = admin(patch(collection + "/reorder").content(JSON.writeValueAsString(Map.of("ids", ids))), 200);
    for (int index = 0; index < ids.size(); index++) {
      assertThat(saved.get(index).get("id").asLong()).isEqualTo(ids.get(index));
      assertThat(saved.get(index).get("sortOrder").asInt()).isEqualTo(index);
    }
  }

  private void reorderRejected(String exam, List<Long> ids, int expected) throws Exception {
    admin(patch(exam + "/sessions/reorder").content(JSON.writeValueAsString(Map.of("ids", ids))), expected);
  }

  private void saveAllAnswers(JsonNode attempt, User user, List<String> questionPaths) throws Exception {
    for (JsonNode session : attempt.get("sessions")) {
      for (JsonNode part : session.get("parts")) {
        for (JsonNode question : part.get("questions")) {
          long questionId = question.get("questionId").asLong();
          String path = questionPaths.stream().filter(candidate -> id(candidate) == questionId)
              .findFirst().orElseThrow();
          JsonNode options = admin(get(path), 200).get("answers");
          long correctId = 0;
          for (JsonNode option : options) {
            if (option.get("isCorrect").asBoolean()) {
              correctId = option.get("id").asLong();
            }
          }
          String answerPath = LEARNER + "/attempts/" + attempt.get("attemptId").asLong() + "/sessions/"
              + session.get("attemptSessionId").asLong() + "/answers";
          assertNoSolutions(student(put(answerPath).content("{\"questionId\":" + questionId
              + ",\"answerId\":" + correctId + "}"), user, 200));
          User other = users.findById(userIds.stream().filter(candidate -> !candidate.equals(user.getId()))
              .findFirst().orElseThrow()).orElseThrow();
          student(put(answerPath).content("{\"questionId\":" + questionId + ",\"answerId\":" + correctId + "}"),
              other, 403);
        }
      }
    }
  }

  private MockHttpServletRequestBuilder start(User owner) {
    return post(LEARNER + "/" + examId + "/attempts")
        .content("{\"userId\":" + owner.getId() + ",\"mode\":\"full\"}");
  }

  private void assertStats(String title, int draft, int published, int archived) throws Exception {
    JsonNode stats = admin(get(ADMIN + "/stats").param("search", title).param("level", "N3")
        .param("status", "DRAFT").param("size", "1"), 200);
    assertThat(stats.get("totalExams").asInt()).isEqualTo(1);
    assertThat(stats.get("draftExams").asInt()).isEqualTo(draft);
    assertThat(stats.get("publishedExams").asInt()).isEqualTo(published);
    assertThat(stats.get("archivedExams").asInt()).isEqualTo(archived);
  }

  private void assertMediaUsed(long image, long audio) {
    for (Long id : List.of(image, audio)) {
      var value = media.findById(id).orElseThrow();
      assertThat(value.getIsUsed()).isTrue();
      assertThat(value.getIsDeleted()).isFalse();
    }
  }

  private void assertNoSolutions(JsonNode response) {
    assertThat(response.toString()).doesNotContain("isCorrect", "correctAnswerId", "explanation");
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

  private long id(String path) {
    return Long.parseLong(path.substring(path.lastIndexOf('/') + 1));
  }

  private JsonNode admin(MockHttpServletRequestBuilder request, int expected) throws Exception {
    return response(request.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))), expected);
  }

  private JsonNode student(MockHttpServletRequestBuilder request, User user, int expected) throws Exception {
    return response(request.with(jwt().jwt(token -> token.subject(user.getEmail()))
        .authorities(new SimpleGrantedAuthority("ROLE_USER"))), expected);
  }

  private JsonNode response(MockHttpServletRequestBuilder request, int expected) throws Exception {
    String body = mvc.perform(request.contentType(MediaType.APPLICATION_JSON)).andExpect(status().is(expected))
        .andReturn().getResponse().getContentAsString();
    return expected == 204 ? null : expected >= 400 ? JSON.readTree(body) : JSON.readTree(body).get("data");
  }
}
