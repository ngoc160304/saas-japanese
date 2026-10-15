package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.UserJlptAttempt;
import com.mycompany.saas_japanese.domain.query.AdminJlptExamQuery;
import com.mycompany.saas_japanese.domain.query.AdminJlptExamStatsQuery;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.AuthTokenService;
import com.mycompany.saas_japanese.service.AdminJlptExamService;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;
import com.mycompany.saas_japanese.util.constant.UserRoleEnum;

import jakarta.persistence.EntityManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

@Transactional
class AdminJlptExamIntegrationTest extends AuthTestSupport {
  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final String BASE = "/api/v1/admin/jlpt-exams";
  private static final String EXAM_BODY = "{\"title\":\"Exam\",\"level\":\"N3\"}";
  private static final String SESSION_BODY = """
      {"name":"Reading","sessionType":"reading","timeLimitMinutes":60,"sortOrder":0}
      """;
  private static final String PART_BODY = "{\"name\":\"Part\",\"sortOrder\":0}";
  private static final String QUESTION_BODY = """
      {"questionText":"Question?","questionType":"single_choice","points":1,"sortOrder":0}
      """;
  private static final String ANSWER_BODY = "{\"answerText\":\"Answer\",\"isCorrect\":true,\"sortOrder\":0}";

  @Autowired private WebApplicationContext context;
  @Autowired private JlptExamRepository exams;
  @Autowired private JlptExamSessionRepository sessions;
  @Autowired private JlptExamPartRepository parts;
  @Autowired private JlptExamQuestionRepository questions;
  @Autowired private JlptExamAnswerRepository answers;
  @Autowired private UserJlptAttemptRepository attempts;
  @Autowired private UserRepository users;
  @Autowired private MediaRepository media;
  @Autowired private AuthTokenService tokens;
  @Autowired private AdminJlptExamService adminExams;
  @Autowired private EntityManager entityManager;
  @Autowired private PlatformTransactionManager transactions;

  private MockMvc mvc;

  @BeforeEach
  void setup() {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  @Test
  void adminAuthorizationAndExamCrudContract() throws Exception {
    mvc.perform(get("/api/v1/admin/jlpt-exams"))
        .andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/admin/jlpt-exams").with(studentJwt()))
        .andExpect(status().isForbidden());

    mvc.perform(post("/api/v1/admin/jlpt-exams").with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\" \"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fieldErrors.title").exists())
        .andExpect(jsonPath("$.fieldErrors.level").exists());

    long examId = createExam("N3 Practice", "N3");
    mvc.perform(get("/api/v1/admin/jlpt-exams").with(adminJwt())
            .param("search", "practice").param("level", "N3")
            .param("status", "DRAFT").param("sortKey", "title")
            .param("sortType", "ASC").param("page", "0").param("size", "12"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content[0].id").value(examId))
        .andExpect(jsonPath("$.data.content[0].status").value("DRAFT"));

    mvc.perform(put("/api/v1/admin/jlpt-exams/{examId}", examId).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"level\":\"N2\",\"title\":\"Updated exam\",\"description\":\"Ready\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.level").value("N2"))
        .andExpect(jsonPath("$.data.title").value("Updated exam"));

    mvc.perform(delete("/api/v1/admin/jlpt-exams/{examId}", examId).with(adminJwt()))
        .andExpect(status().isNoContent());
    JlptExam archived = exams.findById(examId).orElseThrow();
    assertThat(archived.getIsDeleted()).isTrue();
    assertThat(archived.getDeletedAt()).isNotNull();
    assertThat(exams.count()).isPositive();

    mvc.perform(get("/api/v1/admin/jlpt-exams").with(adminJwt()).param("status", "ARCHIVED"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content[0].status").value("ARCHIVED"));
  }

  @Test
  void hierarchyCrudValidatesOwnershipMediaAndPublishRules() throws Exception {
    long examId = createExam("Builder", "N3");
    long otherExamId = createExam("Other", "N2");
    long sessionId = createSession(examId, "Reading", "reading", 60, 0);
    long otherSessionId = createSession(otherExamId, "Other", "reading", 30, 0);

    mvc.perform(get("/api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}",
            examId, otherSessionId).with(adminJwt()))
        .andExpect(status().isNotFound());

    Media audio = media(FileTypeEnum.AUDIO, "audio.mp3");
    long partId = createPart(examId, sessionId, audio.getId());
    assertThat(media.findById(audio.getId()).orElseThrow().getIsUsed()).isTrue();

    Media image = media(FileTypeEnum.IMAGE, "question.png");
    long questionId = createQuestion(examId, sessionId, partId, image.getId());
    assertThat(media.findById(image.getId()).orElseThrow().getIsUsed()).isTrue();

    long correctAnswerId = createAnswer(examId, sessionId, partId, questionId, "Correct", true, 0);
    long secondAnswerId = createAnswer(examId, sessionId, partId, questionId, "Wrong", true, 1);

    mvc.perform(post("/api/v1/admin/jlpt-exams/{examId}/publish", examId).with(adminJwt()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("JLPT exam is not ready for publication"))
        .andExpect(jsonPath("$.issues[0].code").value("CORRECT_ANSWER_COUNT"))
        .andExpect(jsonPath("$.issues[0].message").value(
            "Each single-choice question must have exactly one correct answer"));

    mvc.perform(put(answerPath(), examId, sessionId, partId, questionId, secondAnswerId)
            .with(adminJwt()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"answerText\":\"Wrong\",\"isCorrect\":false,\"sortOrder\":1}"))
        .andExpect(status().isOk());
    mvc.perform(patch(answerPath() + "/sort-order",
            examId, sessionId, partId, questionId, correctAnswerId)
            .with(adminJwt()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"sortOrder\":0}"))
        .andExpect(status().isOk());

    mvc.perform(post("/api/v1/admin/jlpt-exams/{examId}/publish", examId).with(adminJwt()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("PUBLISHED"))
        .andExpect(jsonPath("$.data.sessions[0].parts[0].questions[0].answers[0].isCorrect").value(true));

    mvc.perform(get("/api/v1/admin/jlpt-exams/{examId}", examId).with(studentJwt()))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/jlpt-exams/{examId}/detail", examId).with(studentJwt()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.sessions[0].parts[0].answers").doesNotExist())
        .andExpect(jsonPath("$.data.sessions[0].parts[0].explanation").doesNotExist());

    mvc.perform(post("/api/v1/admin/jlpt-exams/{examId}/unpublish", examId).with(adminJwt()))
        .andExpect(status().isOk());
    mvc.perform(put("/api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}/parts/{partId}",
            examId, sessionId, partId).with(adminJwt()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Part 1\",\"instructions\":\"Read\",\"sortOrder\":0}"))
        .andExpect(status().isOk());
    assertThat(media.findById(audio.getId()).orElseThrow().getIsUsed()).isFalse();

    mvc.perform(delete("/api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}",
            examId, sessionId, partId, questionId).with(adminJwt()))
        .andExpect(status().isNoContent());
    assertThat(questions.findById(questionId)).isEmpty();
    assertThat(answers.findById(correctAnswerId)).isEmpty();
    assertThat(media.findById(image.getId()).orElseThrow().getIsUsed()).isFalse();
  }

  @Test
  void attemptsLockContentAndSoftDeletePreservesHistory() throws Exception {
    long examId = createExam("Used exam", "N4");
    User user = new User();
    user.setEmail("history@example.com");
    user.setUsername("History");
    user.setPassword("hash");
    user.setActive(true);
    user.setVerified(true);
    user = users.save(user);
    UserJlptAttempt attempt = attempts.save(UserJlptAttempt.builder()
        .user(user)
        .jlptExam(exams.findById(examId).orElseThrow())
        .startedAt(Instant.now())
        .build());

    mvc.perform(put("/api/v1/admin/jlpt-exams/{examId}", examId).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"level\":\"N4\",\"title\":\"Changed\"}"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.message").value(
            "An exam with attempts is immutable; create a new revision instead"));
    assertThat(exams.findById(examId).orElseThrow().getTitle()).isEqualTo("Used exam");
    mvc.perform(post(BASE + "/{examId}/sessions", examId).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(SESSION_BODY))
        .andExpect(status().isConflict());
    assertThat(sessions.findByJlptExam_IdOrderBySortOrderAsc(examId)).isEmpty();

    mvc.perform(delete("/api/v1/admin/jlpt-exams/{examId}", examId).with(adminJwt()))
        .andExpect(status().isNoContent());
    assertThat(attempts.findById(attempt.getId())).isPresent();
    assertThat(exams.findById(examId).orElseThrow().getIsDeleted()).isTrue();
  }

  @Test
  void learnerApisHideDraftsAndStartAttemptUsesAuthenticatedUser() throws Exception {
    long draftId = createExam("Hidden draft", "N5");
    mvc.perform(get("/api/v1/jlpt-exams/{examId}", draftId).with(studentJwt()))
        .andExpect(status().isNotFound());

    JlptExam published = exams.findById(draftId).orElseThrow();
    published.setIsPublished(true);
    exams.save(published);
    sessions.save(JlptExamSession.builder()
        .jlptExam(published)
        .name("Listening")
        .sessionType(JlptSessionEnum.listening)
        .timeLimitMinutes(30)
        .sortOrder(0)
        .build());

    User learner = user("learner-jlpt@example.com");
    User another = user("another-jlpt@example.com");
    mvc.perform(post("/api/v1/jlpt-exams/{examId}/attempts", draftId)
            .with(studentJwt(learner.getEmail())).contentType(MediaType.APPLICATION_JSON)
            .content("{\"userId\":%d,\"mode\":\"full\"}".formatted(another.getId())))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/jlpt-exams/{examId}/attempts", draftId)
            .with(studentJwt(learner.getEmail())).contentType(MediaType.APPLICATION_JSON)
            .content("{\"userId\":%d,\"mode\":\"full\"}".formatted(learner.getId())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.examId").value(draftId));
  }

  @Test
  void everyEndpointRejectsAnonymousAndNonAdminWithoutChangingData() throws Exception {
    Hierarchy hierarchy = hierarchy();
    StoredState before = storedState(hierarchy);
    for (Endpoint endpoint : endpoints(hierarchy)) {
      mvc.perform(request(endpoint.method(), endpoint.path())
              .contentType(MediaType.APPLICATION_JSON).content(endpoint.body()))
          .andExpect(status().isUnauthorized())
          .andExpect(header().string("WWW-Authenticate", "Bearer"))
          .andExpect(jsonPath("$.status").value(401))
          .andExpect(jsonPath("$.fieldErrors").isEmpty());
      mvc.perform(request(endpoint.method(), endpoint.path()).with(studentJwt())
              .contentType(MediaType.APPLICATION_JSON).content(endpoint.body()))
          .andExpect(status().isForbidden())
          .andExpect(jsonPath("$.status").value(403))
          .andExpect(jsonPath("$.message").value("Access denied"));
    }
    assertThat(storedState(hierarchy)).isEqualTo(before);
  }

  @Test
  void signedBearerTokensUseExistingAuthorityMappingAndSessionValidation() throws Exception {
    User admin = user("admin-jlpt@example.test");
    admin.setRole(UserRoleEnum.admin);
    users.save(admin);
    var adminTokens = tokens.create(admin, false);
    mvc.perform(get(BASE).header("Authorization", "Bearer " + adminTokens.response().accessToken()))
        .andExpect(status().isOk());

    User student = user("student-jlpt@example.test");
    student.setRole(UserRoleEnum.student);
    users.save(student);
    var studentTokens = tokens.create(student, false);
    mvc.perform(get(BASE).header("Authorization", "Bearer " + studentTokens.response().accessToken()))
        .andExpect(status().isForbidden());

    tokens.revoke(adminTokens.refreshToken());
    mvc.perform(get(BASE).header("Authorization", "Bearer " + adminTokens.response().accessToken()))
        .andExpect(status().isUnauthorized());
    mvc.perform(post(BASE).header("Authorization", "Bearer invalid-token")
            .contentType(MediaType.APPLICATION_JSON).content(EXAM_BODY))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void adminCanReadUpdateReorderAndDeleteEveryHierarchyResource() throws Exception {
    Hierarchy hierarchy = hierarchy();
    List<String> paths = hierarchy.paths();
    List<String> bodies = List.of(EXAM_BODY, SESSION_BODY, PART_BODY, QUESTION_BODY, ANSWER_BODY);
    for (int index = 0; index < paths.size(); index++) {
      mvc.perform(get(paths.get(index)).with(adminJwt())).andExpect(status().isOk())
          .andExpect(jsonPath("$.statusCode").value(200)).andExpect(jsonPath("$.data.id").isNumber());
      mvc.perform(put(paths.get(index)).with(adminJwt())
              .contentType(MediaType.APPLICATION_JSON).content(bodies.get(index)))
          .andExpect(status().isOk());
      if (index > 0) {
        mvc.perform(patch(paths.get(index) + "/sort-order").with(adminJwt())
                .contentType(MediaType.APPLICATION_JSON).content("{\"sortOrder\":0}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.sortOrder").value(0));
      }
    }
    for (int index = paths.size() - 1; index > 0; index--) {
      mvc.perform(delete(paths.get(index)).with(adminJwt())).andExpect(status().isNoContent());
      mvc.perform(get(paths.get(index)).with(adminJwt())).andExpect(status().isNotFound());
    }
    assertThat(sessions.findById(hierarchy.sessionId())).isEmpty();
    assertThat(parts.findById(hierarchy.partId())).isEmpty();
    assertThat(questions.findById(hierarchy.questionId())).isEmpty();
    assertThat(answers.findById(hierarchy.answerId())).isEmpty();
    assertThat(exams.findById(hierarchy.examId()).orElseThrow().getTotalTimeMinutes()).isZero();
    assertThat(media.findAll()).allMatch(item -> !item.getIsUsed());
  }

  @ParameterizedTest
  @ValueSource(strings = {"0", "-1", "abc", "1.5", "9223372036854775808"})
  void invalidIdsAtEveryDepthReturn400WithoutMutations(String invalidId) throws Exception {
    Hierarchy hierarchy = hierarchy();
    StoredState before = storedState(hierarchy);
    badRequest(get(BASE + "/" + invalidId));
    badRequest(put(BASE + "/" + invalidId).content(EXAM_BODY));
    for (int depth = 0; depth < 5; depth++) {
      String path = replaceId(hierarchy.answerPath(), depth, invalidId);
      badRequest(get(path));
      badRequest(patch(path + "/sort-order").content("{\"sortOrder\":1}"));
      badRequest(delete(path));
    }
    assertThat(storedState(hierarchy)).isEqualTo(before);
  }

  @Test
  void paginationAndFilterBindingRejectInvalidValuesAndKeepDefaults() throws Exception {
    for (String page : List.of("-1", "", " ", "abc", "1.5", "2147483648")) {
      badRequest(get(BASE).param("page", page));
    }
    for (String size : List.of("0", "-1", "13", "", " ", "abc", "1.5", "2147483648")) {
      badRequest(get(BASE).param("size", size));
    }
    badRequest(get(BASE).param("level", "N6"));
    badRequest(get(BASE).param("status", "UNKNOWN"));
    mvc.perform(get(BASE).with(adminJwt())).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.size").value(10)).andExpect(jsonPath("$.data.number").value(0));
    mvc.perform(get(BASE).with(adminJwt()).param("size", "1").param("page", "0")
            .param("sortKey", "unknown").param("sortType", "unknown"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.size").value(1));
  }

  @Test
  void requiredFieldsAndMalformedBodiesReturnExistingErrorEnvelope() throws Exception {
    Hierarchy hierarchy = hierarchy();
    StoredState before = storedState(hierarchy);
    for (Endpoint endpoint : endpoints(hierarchy)) {
      if (endpoint.method().equals(HttpMethod.PUT)
          || endpoint.method().equals(HttpMethod.PATCH)
          || (endpoint.method().equals(HttpMethod.POST) && !endpoint.body().isEmpty())) {
        for (String body : List.of("", "null", "{}", "{", "[]", "true", "\"text\"")) {
          badRequest(request(endpoint.method(), endpoint.path()).content(body));
        }
      }
    }
    mvc.perform(post(BASE).with(adminJwt()).contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Validation failed"))
        .andExpect(jsonPath("$.fieldErrors.title").exists()).andExpect(jsonPath("$.fieldErrors.level").exists());
    assertThat(storedState(hierarchy)).isEqualTo(before);
  }

  @Test
  void textEnumAndNumericValidationAppliesToCreatesAndUpdates() throws Exception {
    Hierarchy hierarchy = hierarchy();
    StoredState before = storedState(hierarchy);
    invalidField(hierarchy.examPath(), EXAM_BODY, "title", "null", "\" \"", text(201), "{}", "1", "true");
    invalidField(hierarchy.examPath(), EXAM_BODY, "description", text(501));
    invalidField(hierarchy.examPath(), EXAM_BODY, "level", "null", "\"N6\"", "\"\"", "0", "\"0\"", "{}");
    invalidField(hierarchy.sessionPath(), SESSION_BODY, "name", "null", "\" \"", text(151));
    invalidField(hierarchy.sessionPath(), SESSION_BODY, "sessionType", "null", "\"READING\"", "0");
    invalidField(hierarchy.sessionPath(), SESSION_BODY, "timeLimitMinutes", "null", "0", "-1", "181",
        "2147483648", "{}", "\"invalid\"", "\"60\"", "1.5");
    invalidField(hierarchy.partPath(), PART_BODY, "name", "null", "\" \"", text(151));
    invalidField(hierarchy.partPath(), PART_BODY, "instructions", text(10001));
    invalidField(hierarchy.partPath(), PART_BODY, "audioMediaId", "0", "-1", "9223372036854775808", "{}",
        "1.5", "\"1\"", "\"\"");
    invalidField(hierarchy.questionPath(), QUESTION_BODY, "questionText", "null", "\" \"", text(20001));
    invalidField(hierarchy.questionPath(), QUESTION_BODY, "passageText", text(50001));
    invalidField(hierarchy.questionPath(), QUESTION_BODY, "explanation", text(20001));
    invalidField(hierarchy.questionPath(), QUESTION_BODY, "questionType", "null", "\"multiple_choice\"", "0");
    invalidField(hierarchy.questionPath(), QUESTION_BODY, "points", "null", "0", "-1", "0.001", "1000",
        "1.234", "\"invalid\"", "{}", "\"1.00\"");
    invalidField(hierarchy.questionPath(), QUESTION_BODY, "imageMediaId", "0", "-1", "{}", "1.5");
    invalidField(hierarchy.answerPath(), ANSWER_BODY, "answerText", "null", "\" \"", text(501));
    invalidField(hierarchy.answerPath(), ANSWER_BODY, "isCorrect", "null", "{}", "\"invalid\"", "1", "\"true\"");
    List<String> paths = hierarchy.paths();
    List<String> bodies = List.of(EXAM_BODY, SESSION_BODY, PART_BODY, QUESTION_BODY, ANSWER_BODY);
    for (int index = 1; index < paths.size(); index++) {
      invalidField(paths.get(index), bodies.get(index), "sortOrder", "null", "-1", "2147483648", "{}", "1.5");
      for (String value : List.of("null", "-1", "2147483648", "{}", "1.5")) {
        badRequest(patch(paths.get(index) + "/sort-order").content("{\"sortOrder\":" + value + "}"));
      }
    }
    assertThat(storedState(hierarchy)).isEqualTo(before);
  }

  @Test
  void validBoundaryValuesAndOptionalMediaStillWork() throws Exception {
    long examId = createExam("x".repeat(200), "N1");
    long sessionId = createSession(examId, "x".repeat(150), "language_knowledge", 180, 0);
    String partPath = BASE + "/" + examId + "/sessions/" + sessionId + "/parts";
    long partId = responseId(mvc.perform(post(partPath).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Part without media\"}"))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.data.sortOrder").value(0))
        .andExpect(jsonPath("$.data.questions").isEmpty())
        .andReturn().getResponse().getContentAsString());
    for (String points : List.of("0.01", "999.99")) {
      mvc.perform(post(partPath + "/" + partId + "/questions").with(adminJwt())
              .contentType(MediaType.APPLICATION_JSON)
              .content(QUESTION_BODY.replace("\"points\":1", "\"points\":" + points)))
          .andExpect(status().isCreated()).andExpect(jsonPath("$.data.points").value(Double.parseDouble(points)));
    }
    mvc.perform(get(BASE + "/" + examId).with(adminJwt()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalTimeMinutes").value(180));
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void mediaBusinessValidationLeavesReferencesAndUsageUnchanged() throws Exception {
    Hierarchy hierarchy = hierarchy();
    Media wrongType = media(FileTypeEnum.IMAGE, "unused.png");
    Media deletedAudio = media(FileTypeEnum.AUDIO, "deleted.mp3");
    deletedAudio.setIsDeleted(true);
    media.save(deletedAudio);
    List<Long> mediaIds = List.of(wrongType.getId(), deletedAudio.getId(),
        parts.findById(hierarchy.partId()).orElseThrow().getAudioMediaId(),
        questions.findById(hierarchy.questionId()).orElseThrow().getImageMediaId());
    try {
      StoredState before = storedState(hierarchy);
      Long inUse = parts.findById(hierarchy.partId()).orElseThrow().getAudioMediaId();
      mvc.perform(post(hierarchy.sessionPath() + "/parts").with(adminJwt())
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"name\":\"New\",\"audioMediaId\":" + inUse + "}"))
          .andExpect(status().isConflict());
      for (Long missingId : List.of(Long.MAX_VALUE, deletedAudio.getId())) {
        mvc.perform(put(hierarchy.partPath()).with(adminJwt()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Changed\",\"audioMediaId\":" + missingId + "}"))
            .andExpect(status().isNotFound());
      }
      badRequest(put(hierarchy.partPath())
          .content("{\"name\":\"Changed\",\"audioMediaId\":" + wrongType.getId() + "}"));
      assertThat(storedState(hierarchy)).isEqualTo(before);
    } finally {
      mvc.perform(delete(hierarchy.sessionPath()).with(adminJwt())).andExpect(status().isNoContent());
      new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
        exams.deleteById(hierarchy.examId());
        media.deleteAllById(mediaIds);
      });
    }
  }

  @Test
  void parentChildMismatchAtEveryDepthReturns404WithoutMutations() throws Exception {
    Hierarchy hierarchy = hierarchy();
    Hierarchy other = hierarchy();
    StoredState before = storedState(hierarchy);
    StoredState otherBefore = storedState(other);
    List<Long> otherIds = List.of(other.examId(), other.sessionId(), other.partId(), other.questionId());
    for (int index = 0; index < otherIds.size(); index++) {
      String path = replaceId(hierarchy.answerPath(), index, otherIds.get(index).toString());
      mvc.perform(get(path).with(adminJwt())).andExpect(status().isNotFound());
      mvc.perform(put(path).with(adminJwt()).contentType(MediaType.APPLICATION_JSON).content(ANSWER_BODY))
          .andExpect(status().isNotFound());
      mvc.perform(delete(path).with(adminJwt())).andExpect(status().isNotFound());
    }
    assertThat(storedState(hierarchy)).isEqualTo(before);
    assertThat(storedState(other)).isEqualTo(otherBefore);
  }

  @Test
  void publishedAndArchivedExamsRetainExistingContentRestrictions() throws Exception {
    Hierarchy hierarchy = hierarchy();
    createAnswer(hierarchy.examId(), hierarchy.sessionId(), hierarchy.partId(), hierarchy.questionId(),
        "Wrong", false, 1);
    mvc.perform(post(hierarchy.examPath() + "/publish").with(adminJwt())).andExpect(status().isOk());
    StoredState published = storedState(hierarchy);
    mvc.perform(put(hierarchy.examPath()).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(EXAM_BODY)).andExpect(status().isConflict());
    mvc.perform(patch(hierarchy.answerPath() + "/sort-order").with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content("{\"sortOrder\":2}"))
        .andExpect(status().isConflict());
    assertThat(storedState(hierarchy)).isEqualTo(published);
    mvc.perform(post(hierarchy.examPath() + "/unpublish").with(adminJwt())).andExpect(status().isOk());
    mvc.perform(delete(hierarchy.examPath()).with(adminJwt())).andExpect(status().isNoContent());
    mvc.perform(get(hierarchy.examPath()).with(adminJwt())).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("ARCHIVED"))
        .andExpect(jsonPath("$.data.contentLocked").value(true));
    mvc.perform(get(hierarchy.answerPath()).with(adminJwt())).andExpect(status().isOk());
    for (String action : List.of("publish", "unpublish")) {
      mvc.perform(post(hierarchy.examPath() + "/" + action).with(adminJwt())).andExpect(status().isNotFound());
    }
    mvc.perform(put(hierarchy.partPath()).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(PART_BODY)).andExpect(status().isNotFound());
  }

  @Test
  void examMetadataIsNormalizedAndCannotOverrideLifecycleOrDerivedValues() throws Exception {
    String body = """
        {"level":"N3","title":"  Practice  ","description":"  Overview  ",
         "status":"PUBLISHED","isPublished":true,"isDeleted":true,"totalTimeMinutes":999,"passingScore":1}
        """;
    long examId = responseId(mvc.perform(post(BASE).with(adminJwt()).contentType(MediaType.APPLICATION_JSON)
            .content(body)).andExpect(status().isCreated())
        .andExpect(jsonPath("$.statusCode").value(201))
        .andExpect(jsonPath("$.data.title").value("Practice"))
        .andExpect(jsonPath("$.data.description").value("Overview"))
        .andExpect(jsonPath("$.data.status").value("DRAFT"))
        .andExpect(jsonPath("$.data.contentLocked").value(false))
        .andExpect(jsonPath("$.data.hasAttempts").value(false))
        .andExpect(jsonPath("$.data.totalTimeMinutes").value(0))
        .andExpect(jsonPath("$.data.sessionCount").value(0))
        .andExpect(jsonPath("$.data.partCount").value(0))
        .andExpect(jsonPath("$.data.questionCount").value(0))
        .andExpect(jsonPath("$.data.passingScore").value(95))
        .andExpect(jsonPath("$.data.sessions").isEmpty()).andReturn().getResponse().getContentAsString());
    long sessionId = createSession(examId, "Reading", "reading", 45, 0);
    mvc.perform(put(BASE + "/{id}", examId).with(adminJwt()).contentType(MediaType.APPLICATION_JSON)
            .content(body.replace("N3", "N2").replace("  Overview  ", "   ")))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.level").value("N2"))
        .andExpect(jsonPath("$.data.description").isEmpty())
        .andExpect(jsonPath("$.data.status").value("DRAFT"))
        .andExpect(jsonPath("$.data.passingScore").value(90))
        .andExpect(jsonPath("$.data.sessionCount").value(1))
        .andExpect(jsonPath("$.data.totalTimeMinutes").value(45));
    mvc.perform(put(BASE + "/{id}/sessions/{sessionId}", examId, sessionId).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(SESSION_BODY))
        .andExpect(status().isOk());
    assertThat(exams.findById(examId).orElseThrow().getTotalTimeMinutes()).isEqualTo(60);
    mvc.perform(get(BASE).with(adminJwt())).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content[0].totalTimeMinutes").value(60));
    mvc.perform(delete(BASE + "/{id}/sessions/{sessionId}", examId, sessionId).with(adminJwt()))
        .andExpect(status().isNoContent());
    mvc.perform(get(BASE + "/{id}", examId).with(adminJwt())).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalTimeMinutes").value(0))
        .andExpect(jsonPath("$.data.sessionCount").value(0));
    assertThat(exams.findById(examId).orElseThrow().getTotalTimeMinutes()).isZero();
  }

  @ParameterizedTest
  @CsvSource({"N1,100", "N2,90", "N3,95", "N4,90", "N5,80"})
  void passingScoreMatchesExistingScoringRules(String level, int passingScore) throws Exception {
    long examId = createExam("Passing score", level);
    mvc.perform(get(BASE + "/{id}", examId).with(adminJwt())).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.passingScore").value(passingScore));
    mvc.perform(get(BASE).with(adminJwt()).param("level", level)).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content[0].passingScore").value(passingScore));
  }

  @Test
  void listAndStatisticsApplySearchAndLevelToEveryStatusBucket() throws Exception {
    long draft = catalogExam(" Practice draft ", "N3", "DRAFT");
    long published = catalogExam("Other title", "N3", "PUBLISHED");
    long archived = catalogExam("Practice archived", "N3", "ARCHIVED");
    long otherLevel = catalogExam("Practice N4", "N4", "DRAFT");
    long unrelated = catalogExam("Unrelated", "N2", "PUBLISHED");
    JlptExam descriptionMatch = exams.findById(published).orElseThrow();
    descriptionMatch.setDescription("A PRACTICE description");
    exams.findById(unrelated).orElseThrow().setDescription(null);

    assertThat(listIds(get(BASE))).containsExactly(draft, published, otherLevel, unrelated);
    assertThat(listIds(get(BASE).param("search", "  pRaCtIcE  "))).containsExactly(draft, published, otherLevel);
    assertThat(listIds(get(BASE).param("search", "practice").param("level", "N3")))
        .containsExactly(draft, published);
    assertThat(listIds(get(BASE).param("search", "practice").param("level", "N3").param("status", "DRAFT")))
        .containsExactly(draft);
    assertThat(listIds(get(BASE).param("search", "practice").param("level", "N3").param("status", "PUBLISHED")))
        .containsExactly(published);
    assertThat(listIds(get(BASE).param("search", "practice").param("level", "N3").param("status", "ARCHIVED")))
        .containsExactly(archived);
    assertThat(listIds(get(BASE).param("status", "ARCHIVED").param("level", "N4"))).isEmpty();

    assertStatistics(get(BASE + "/stats"), 5, 2, 2, 1);
    assertStatistics(get(BASE + "/stats").param("search", "  pRaCtIcE  "), 4, 2, 1, 1);
    assertStatistics(get(BASE + "/stats").param("level", "N3"), 3, 1, 1, 1);
    for (String selectedStatus : List.of("DRAFT", "PUBLISHED", "ARCHIVED")) {
      assertStatistics(get(BASE + "/stats").param("search", "practice").param("level", "N3")
          .param("status", selectedStatus).param("page", "99").param("size", "1"), 3, 1, 1, 1);
    }
    assertStatistics(get(BASE + "/stats").param("search", " ").param("level", ""), 5, 2, 2, 1);
    assertStatistics(get(BASE + "/stats").param("search", "absent"), 0, 0, 0, 0);
    assertStatistics(get(BASE + "/stats").param("level", "N1"), 0, 0, 0, 0);
    badRequest(get(BASE + "/stats").param("level", "N6"));
    // Archived status takes precedence over a legacy publication flag in both APIs.
    exams.findById(archived).orElseThrow().setIsPublished(true);
    assertStatistics(get(BASE + "/stats"), 5, 2, 2, 1);
    assertThat(listIds(get(BASE).param("status", "PUBLISHED"))).containsExactly(published, unrelated);
  }

  @Test
  void paginationIsStableAcrossTiesAndKeepsAccurateTotals() throws Exception {
    List<Long> ids = new ArrayList<>();
    for (int index = 0; index < 5; index++) {
      ids.add(createExam("Same title", "N3"));
    }
    entityManager.flush();
    entityManager.createQuery("update JlptExam set createdAt = :time, updatedAt = :time")
        .setParameter("time", Instant.parse("2026-01-01T00:00:00Z")).executeUpdate();
    entityManager.clear();
    List<Long> descending = new ArrayList<>(ids);
    java.util.Collections.reverse(descending);
    for (String sortKey : List.of("title", "level", "status", "totalTimeMinutes", "createdAt", "updatedAt", "id")) {
      for (String direction : List.of("ASC", "DESC")) {
        List<Long> pagedIds = new ArrayList<>();
        for (int page = 0; page < 3; page++) {
          JsonNode data = adminData(get(BASE).param("sortKey", sortKey).param("sortType", direction)
              .param("page", Integer.toString(page)).param("size", "2"));
          assertThat(data.get("totalElements").asLong()).isEqualTo(5);
          assertThat(data.get("totalPages").asInt()).isEqualTo(3);
          assertThat(data.get("number").asInt()).isEqualTo(page);
          assertThat(data.get("size").asInt()).isEqualTo(2);
          assertThat(data.get("first").asBoolean()).isEqualTo(page == 0);
          assertThat(data.get("last").asBoolean()).isEqualTo(page == 2);
          data.get("content").forEach(item -> pagedIds.add(item.get("id").asLong()));
        }
        assertThat(pagedIds).containsExactlyElementsOf(direction.equals("ASC") ? ids : descending);
      }
    }
    JsonNode fallback = adminData(get(BASE).param("sortKey", "sessions.name").param("sortType", "bad"));
    assertThat(jsonIds(fallback.get("content"))).containsExactlyElementsOf(descending);
    assertThat(jsonIds(adminData(get(BASE)).get("content"))).containsExactlyElementsOf(descending);
    JsonNode beyond = adminData(get(BASE).param("page", "3").param("size", "2"));
    assertThat(beyond.get("content")).isEmpty();
    assertThat(beyond.get("totalElements").asLong()).isEqualTo(5);
  }

  @Test
  void emptyCatalogHasEmptyPagesAndZeroStatistics() throws Exception {
    assertThat(exams.count()).isZero();
    JsonNode data = adminData(get(BASE));
    assertThat(data.get("content")).isEmpty();
    assertThat(data.get("totalElements").asLong()).isZero();
    assertThat(data.get("totalPages").asInt()).isZero();
    assertThat(data.get("number").asInt()).isZero();
    assertStatistics(get(BASE + "/stats"), 0, 0, 0, 0);
    assertStatistics(get(BASE + "/stats").param("search", "anything").param("level", "N5"), 0, 0, 0, 0);
  }

  @Test
  void statisticsEndpointRequiresAdminAndDoesNotBindStatsAsAnId() throws Exception {
    mvc.perform(get(BASE + "/stats")).andExpect(status().isUnauthorized());
    mvc.perform(get(BASE + "/stats").with(studentJwt())).andExpect(status().isForbidden());
    mvc.perform(get(BASE + "/stats").with(adminJwt())).andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Fetch admin JLPT exam statistics"))
        .andExpect(jsonPath("$.data.totalExams").isNumber());
  }

  @Test
  void countsAndLocksMatchOrderedDetailAcrossDifferentHierarchySizes() throws Exception {
    Hierarchy first = hierarchy();
    Hierarchy second = hierarchy();
    long empty = createExam("Empty", "N5");
    // Seed legacy ties explicitly: new API writes now shift siblings into unique positions.
    long extraSession = createSession(first.examId(), "Second", "listening", 20, 0);
    long extraPart = responseId(mvc.perform(post(first.sessionPath() + "/parts").with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(PART_BODY)).andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString());
    long extraQuestion = responseId(mvc.perform(post(first.partPath() + "/questions").with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(QUESTION_BODY)).andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString());
    long extraAnswer = createAnswer(first.examId(), first.sessionId(), first.partId(), first.questionId(),
        "Second", false, 0);
    sessions.findByJlptExam_IdOrderBySortOrderAsc(first.examId()).forEach(item -> item.setSortOrder(0));
    parts.findByJlptExamSession_IdOrderBySortOrderAsc(first.sessionId()).forEach(item -> item.setSortOrder(0));
    questions.findByJlptExamPartIdOrderBySortOrderAsc(first.partId()).forEach(item -> item.setSortOrder(0));
    answers.findByJlptExamQuestionIdOrderBySortOrderAsc(first.questionId()).forEach(item -> item.setSortOrder(0));
    attempts.save(UserJlptAttempt.builder().user(user("counts@example.test"))
        .jlptExam(exams.findById(first.examId()).orElseThrow()).build());
    exams.findById(second.examId()).orElseThrow().setIsPublished(true);
    entityManager.flush();
    entityManager.clear();
    JsonNode detail = adminData(get(first.examPath()));
    assertCounts(detail, 2, 2, 2, 80, true, true);
    assertThat(jsonIds(detail.get("sessions"))).containsExactly(first.sessionId(), extraSession);
    JsonNode session = detail.get("sessions").get(0);
    assertThat(jsonIds(session.get("parts"))).containsExactly(first.partId(), extraPart);
    JsonNode part = session.get("parts").get(0);
    assertThat(jsonIds(part.get("questions"))).containsExactly(first.questionId(), extraQuestion);
    JsonNode question = part.get("questions").get(0);
    assertThat(jsonIds(question.get("answers"))).containsExactly(first.answerId(), extraAnswer);
    assertThat(question.get("answers").get(0).get("isCorrect").asBoolean()).isTrue();
    assertThat(question.get("explanation").asString()).isEqualTo("Explanation");
    assertThat(question.get("image").get("secureUrl").asString()).contains("image.png");
    assertThat(part.get("audio").get("secureUrl").asString()).contains("audio.mp3");
    JsonNode content = adminData(get(BASE).param("sortKey", "id").param("sortType", "ASC")).get("content");
    assertCounts(content.get(0), 2, 2, 2, 80, true, true);
    assertCounts(content.get(1), 1, 1, 1, 60, false, true);
    assertCounts(content.get(2), 0, 0, 0, 0, false, false);
    assertThat(content.get(2).get("id").asLong()).isEqualTo(empty);
    for (int index = 0; index < 3; index++) {
      JsonNode item = content.get(index);
      JsonNode itemDetail = adminData(get(BASE + "/" + item.get("id").asLong()));
      for (String field : List.of("sessionCount", "partCount", "questionCount", "hasAttempts", "contentLocked",
          "totalTimeMinutes", "passingScore", "status")) {
        assertThat(item.get(field)).isEqualTo(itemDetail.get(field));
      }
    }
  }

  @Test
  void catalogReadsUseBoundedQueriesAsExamAndHierarchyCountsGrow() throws Exception {
    Hierarchy hierarchy = hierarchy();
    entityManager.flush();
    entityManager.clear();
    var statistics = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
    boolean previouslyEnabled = statistics.isStatisticsEnabled();
    statistics.setStatisticsEnabled(true);
    try {
      AdminJlptExamQuery query = new AdminJlptExamQuery();
      query.setSize(1);
      statistics.clear();
      assertThat(adminExams.findAll(query).getContent()).hasSize(1);
      assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(5);
      entityManager.clear();
      statistics.clear();
      assertThat(adminExams.findById(hierarchy.examId()).getQuestionCount()).isEqualTo(1);
      long detailQueries = statistics.getPrepareStatementCount();
      assertThat(detailQueries).isLessThanOrEqualTo(7);
      for (int examIndex = 0; examIndex < 12; examIndex++) {
        JlptExam exam = exams.save(JlptExam.builder().title("Bulk " + examIndex).jlptLevel(JlptLevelEnum.N3).build());
        addContent(exam, 4, 3, 5);
      }
      addContent(exams.findById(hierarchy.examId()).orElseThrow(), 4, 3, 5);
      entityManager.flush();
      entityManager.clear();
      query.setSize(12);
      query.setSortKey("id");
      query.setSortType("ASC");
      statistics.clear();
      var page = adminExams.findAll(query);
      assertThat(page.getContent()).hasSize(12);
      assertThat(page.getTotalElements()).isEqualTo(13);
      assertThat(statistics.getPrepareStatementCount()).isEqualTo(5);
      assertThat(page.getContent().get(0).getSessionCount()).isEqualTo(5);
      assertThat(page.getContent().get(0).getPartCount()).isEqualTo(13);
      assertThat(page.getContent().get(0).getQuestionCount()).isEqualTo(61);
      assertThat(page.getContent().get(0).getTotalTimeMinutes()).isEqualTo(100);
      assertThat(page.getContent().subList(1, 12)).allSatisfy(item -> {
        assertThat(item.getSessionCount()).isEqualTo(4);
        assertThat(item.getPartCount()).isEqualTo(12);
        assertThat(item.getQuestionCount()).isEqualTo(60);
        assertThat(item.getTotalTimeMinutes()).isEqualTo(40);
      });
      entityManager.clear();
      statistics.clear();
      assertThat(adminExams.findById(hierarchy.examId()).getQuestionCount()).isEqualTo(61);
      assertThat(statistics.getPrepareStatementCount()).isEqualTo(detailQueries);
      entityManager.clear();
      statistics.clear();
      assertThat(adminExams.statistics(new AdminJlptExamStatsQuery()).totalExams()).isEqualTo(13);
      assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
      assertThat(statistics.getEntityLoadCount()).isZero();
    } finally {
      statistics.setStatisticsEnabled(previouslyEnabled);
    }
  }

  @Test
  void archivePreservesCompletedAttemptAnswersResultsHierarchyAndMedia() throws Exception {
    Hierarchy hierarchy = hierarchy();
    createAnswer(hierarchy.examId(), hierarchy.sessionId(), hierarchy.partId(), hierarchy.questionId(),
        "Wrong", false, 1);
    mvc.perform(post(hierarchy.examPath() + "/publish").with(adminJwt())).andExpect(status().isOk());
    User learner = user("archive-history@example.test");
    learner.setRole(UserRoleEnum.student);
    JsonNode started = JSON.readTree(mvc.perform(post(hierarchy.examPath().replace("/admin", "") + "/attempts")
            .with(studentJwt(learner.getEmail())).contentType(MediaType.APPLICATION_JSON)
            .content("{\"userId\":" + learner.getId() + ",\"mode\":\"full\"}"))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("data");
    long attemptId = started.get("attemptId").asLong();
    long attemptSessionId = started.get("sessions").get(0).get("attemptSessionId").asLong();
    String attemptPath = "/api/v1/jlpt-exams/attempts/" + attemptId;
    mvc.perform(put(attemptPath + "/sessions/" + attemptSessionId + "/answers")
            .with(studentJwt(learner.getEmail())).contentType(MediaType.APPLICATION_JSON)
            .content("{\"questionId\":" + hierarchy.questionId() + ",\"answerId\":" + hierarchy.answerId() + "}"))
        .andExpect(status().isOk());
    mvc.perform(post(attemptPath + "/submit").with(studentJwt(learner.getEmail())))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalScore").value(1));
    // Compare persisted timestamps at database precision on both sides of archive.
    entityManager.flush();
    entityManager.clear();
    List<String> learnerPaths = List.of(attemptPath + "/result", attemptPath + "/review",
        "/api/v1/jlpt-exams/attempts/history");
    List<JsonNode> before = new ArrayList<>();
    for (String path : learnerPaths) {
      before.add(learnerData(path, learner.getEmail()));
    }
    mvc.perform(post(hierarchy.examPath() + "/unpublish").with(adminJwt())).andExpect(status().isOk());
    StoredState locked = storedState(hierarchy);
    mvc.perform(put(hierarchy.examPath()).with(adminJwt()).contentType(MediaType.APPLICATION_JSON).content(EXAM_BODY))
        .andExpect(status().isConflict());
    assertThat(storedState(hierarchy)).isEqualTo(locked);
    mvc.perform(delete(hierarchy.examPath()).with(adminJwt())).andExpect(status().isNoContent());
    entityManager.flush();
    entityManager.clear();
    Instant deletedAt = exams.findById(hierarchy.examId()).orElseThrow().getDeletedAt();
    assertThat(deletedAt).isNotNull();
    assertThat(exams.findById(hierarchy.examId()).orElseThrow().getIsPublished()).isFalse();
    JsonNode archived = adminData(get(hierarchy.examPath()));
    assertCounts(archived, 1, 1, 1, 60, true, true);
    assertThat(archived.get("status").asString()).isEqualTo("ARCHIVED");
    assertThat(archived.get("sessions")).isEqualTo(locked.detail().get("sessions"));
    assertThat(media.findAll()).allMatch(item -> Boolean.TRUE.equals(item.getIsUsed())
        && !Boolean.TRUE.equals(item.getIsDeleted()));
    assertThat(attempts.findById(attemptId).orElseThrow().getTotalScore()).isEqualByComparingTo(BigDecimal.ONE);
    for (int index = 0; index < learnerPaths.size(); index++) {
      assertThat(learnerData(learnerPaths.get(index), learner.getEmail())).isEqualTo(before.get(index));
    }
    assertThat(listIds(get(BASE))).isEmpty();
    JsonNode summary = adminData(get(BASE).param("status", "ARCHIVED")).get("content").get(0);
    assertCounts(summary, 1, 1, 1, 60, true, true);
    for (String action : List.of("publish", "unpublish")) {
      mvc.perform(post(hierarchy.examPath() + "/" + action).with(adminJwt())).andExpect(status().isNotFound());
    }
    mvc.perform(put(hierarchy.examPath()).with(adminJwt()).contentType(MediaType.APPLICATION_JSON).content(EXAM_BODY))
        .andExpect(status().isNotFound());
    mvc.perform(delete(hierarchy.examPath()).with(adminJwt())).andExpect(status().isNotFound());
    assertThat(exams.findById(hierarchy.examId()).orElseThrow().getDeletedAt()).isEqualTo(deletedAt);
    assertThat(storedState(hierarchy).counts()).isEqualTo(locked.counts());
    assertThat(storedState(hierarchy).mediaUsage()).isEqualTo(locked.mediaUsage());
  }

  private JsonNode learnerData(String path, String subject) throws Exception {
    return JSON.readTree(mvc.perform(get(path).with(studentJwt(subject))).andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString()).get("data");
  }

  private void addContent(JlptExam exam, int sessionCount, int partCount, int questionCount) {
    for (int sessionIndex = 0; sessionIndex < sessionCount; sessionIndex++) {
      JlptExamSession session = sessions.save(JlptExamSession.builder().jlptExam(exam).name("Bulk session")
          .sessionType(JlptSessionEnum.reading).timeLimitMinutes(10).sortOrder(sessionIndex).build());
      for (int partIndex = 0; partIndex < partCount; partIndex++) {
        JlptExamPart part = parts.save(JlptExamPart.builder().jlptExamSession(session).name("Bulk part")
            .sortOrder(partIndex).build());
        for (int questionIndex = 0; questionIndex < questionCount; questionIndex++) {
          questions.save(JlptExamQuestion.builder().jlptExamPart(part).questionText("Bulk question")
              .questionType(JlptQuestionEnum.single_choice).sortOrder(questionIndex).build());
        }
      }
    }
  }

  private long catalogExam(String title, String level, String status) throws Exception {
    long id = createExam(title, level);
    JlptExam exam = exams.findById(id).orElseThrow();
    exam.setIsPublished(status.equals("PUBLISHED"));
    if (status.equals("ARCHIVED")) {
      exam.setIsDeleted(true);
      exam.setDeletedAt(Instant.now());
    }
    return id;
  }

  private JsonNode adminData(MockHttpServletRequestBuilder builder) throws Exception {
    return JSON.readTree(mvc.perform(builder.with(adminJwt())).andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString()).get("data");
  }

  private List<Long> listIds(MockHttpServletRequestBuilder builder) throws Exception {
    return jsonIds(adminData(builder.param("sortKey", "id").param("sortType", "ASC")).get("content"));
  }

  private List<Long> jsonIds(JsonNode nodes) {
    List<Long> ids = new ArrayList<>();
    nodes.forEach(node -> ids.add(node.get("id").asLong()));
    return ids;
  }

  private void assertCounts(JsonNode data, int sessionCount, int partCount, int questionCount, int duration,
      boolean hasAttempts, boolean contentLocked) {
    assertThat(data.get("sessionCount").asLong()).isEqualTo(sessionCount);
    assertThat(data.get("partCount").asLong()).isEqualTo(partCount);
    assertThat(data.get("questionCount").asLong()).isEqualTo(questionCount);
    assertThat(data.get("totalTimeMinutes").asInt()).isEqualTo(duration);
    assertThat(data.get("hasAttempts").asBoolean()).isEqualTo(hasAttempts);
    assertThat(data.get("contentLocked").asBoolean()).isEqualTo(contentLocked);
  }

  private void assertStatistics(
      MockHttpServletRequestBuilder builder, int total, int draft, int published, int archived) throws Exception {
    JsonNode data = adminData(builder);
    assertThat(data.get("totalExams").asLong()).isEqualTo(total);
    assertThat(data.get("draftExams").asLong()).isEqualTo(draft);
    assertThat(data.get("publishedExams").asLong()).isEqualTo(published);
    assertThat(data.get("archivedExams").asLong()).isEqualTo(archived);
    assertThat(data.get("totalExams").asLong()).isEqualTo(data.get("draftExams").asLong()
        + data.get("publishedExams").asLong() + data.get("archivedExams").asLong());
  }

  private void badRequest(MockHttpServletRequestBuilder builder) throws Exception {
    mvc.perform(builder.with(adminJwt()).contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.message").isString()).andExpect(jsonPath("$.fieldErrors").isMap())
        .andExpect(jsonPath("$.timestamp").exists()).andExpect(jsonPath("$.data").doesNotExist())
        .andExpect(jsonPath("$.trace").doesNotExist());
  }

  private void invalidField(String path, String body, String field, String... values) throws Exception {
    String collectionPath = path.substring(0, path.lastIndexOf('/'));
    for (String value : values) {
      ObjectNode requestBody = (ObjectNode) JSON.readTree(body);
      requestBody.set(field, JSON.readTree(value));
      String content = JSON.writeValueAsString(requestBody);
      badRequest(post(collectionPath).content(content));
      badRequest(put(path).content(content));
    }
  }

  private String text(int length) {
    return JSON.writeValueAsString("x".repeat(length));
  }

  private String replaceId(String path, int depth, String id) {
    String[] segments = path.split("/");
    segments[5 + depth * 2] = id;
    return String.join("/", segments);
  }

  private Hierarchy hierarchy() throws Exception {
    long examId = createExam("Boundary", "N3");
    long sessionId = createSession(examId, "Reading", "reading", 60, 0);
    long partId = createPart(examId, sessionId, media(FileTypeEnum.AUDIO, "audio.mp3").getId());
    long questionId = createQuestion(examId, sessionId, partId, media(FileTypeEnum.IMAGE, "image.png").getId());
    long answerId = createAnswer(examId, sessionId, partId, questionId, "Correct", true, 0);
    return new Hierarchy(examId, sessionId, partId, questionId, answerId);
  }

  private StoredState storedState(Hierarchy hierarchy) throws Exception {
    new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
      entityManager.flush();
      entityManager.clear();
    });
    String response = mvc.perform(get(hierarchy.examPath()).with(adminJwt()))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    return new StoredState(JSON.readTree(response).get("data"),
        List.of(exams.count(), sessions.count(), parts.count(), questions.count(), answers.count(), media.count()),
        media.findAll().stream().map(Media::getIsUsed).toList());
  }

  private List<Endpoint> endpoints(Hierarchy hierarchy) {
    List<Endpoint> result = new java.util.ArrayList<>();
    result.add(new Endpoint(HttpMethod.GET, BASE, ""));
    result.add(new Endpoint(HttpMethod.GET, BASE + "/stats", ""));
    result.add(new Endpoint(HttpMethod.POST, BASE, EXAM_BODY));
    List<String> paths = hierarchy.paths();
    List<String> bodies = List.of(EXAM_BODY, SESSION_BODY, PART_BODY, QUESTION_BODY, ANSWER_BODY);
    List<String> collections = List.of("sessions", "parts", "questions", "answers");
    for (int index = 0; index < paths.size(); index++) {
      String path = paths.get(index);
      result.add(new Endpoint(HttpMethod.GET, path, ""));
      result.add(new Endpoint(HttpMethod.PUT, path, bodies.get(index)));
      result.add(new Endpoint(HttpMethod.DELETE, path, ""));
      if (index > 0) {
        result.add(new Endpoint(HttpMethod.POST, paths.get(index - 1) + "/" + collections.get(index - 1),
            bodies.get(index)));
        result.add(new Endpoint(HttpMethod.PATCH, path + "/sort-order", "{\"sortOrder\":1}"));
      }
    }
    result.add(new Endpoint(HttpMethod.POST, hierarchy.examPath() + "/publish", ""));
    result.add(new Endpoint(HttpMethod.POST, hierarchy.examPath() + "/unpublish", ""));
    return result;
  }

  private record Endpoint(HttpMethod method, String path, String body) { }

  private record StoredState(JsonNode detail, List<Long> counts, List<Boolean> mediaUsage) { }

  private record Hierarchy(long examId, long sessionId, long partId, long questionId, long answerId) {
    String examPath() { return BASE + "/" + examId; }
    String sessionPath() { return examPath() + "/sessions/" + sessionId; }
    String partPath() { return sessionPath() + "/parts/" + partId; }
    String questionPath() { return partPath() + "/questions/" + questionId; }
    String answerPath() { return questionPath() + "/answers/" + answerId; }
    List<String> paths() { return List.of(examPath(), sessionPath(), partPath(), questionPath(), answerPath()); }
  }

  private long createExam(String title, String level) throws Exception {
    String body = """
        {"level":"%s","title":"%s","description":"Description"}
        """.formatted(level, title);
    return responseId(mvc.perform(post("/api/v1/admin/jlpt-exams").with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
  }

  private long createSession(
      long examId, String name, String type, int timeLimit, int sortOrder) throws Exception {
    String body = """
        {"name":"%s","sessionType":"%s","timeLimitMinutes":%d,"sortOrder":%d}
        """.formatted(name, type, timeLimit, sortOrder);
    return responseId(mvc.perform(post("/api/v1/admin/jlpt-exams/{examId}/sessions", examId)
            .with(adminJwt()).contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
  }

  private long createPart(long examId, long sessionId, long audioMediaId) throws Exception {
    String body = """
        {"name":"Part 1","instructions":"Read","sortOrder":0,"audioMediaId":%d}
        """.formatted(audioMediaId);
    return responseId(mvc.perform(post("/api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}/parts",
            examId, sessionId).with(adminJwt()).contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
  }

  private long createQuestion(
      long examId, long sessionId, long partId, long imageMediaId) throws Exception {
    String body = """
        {"questionText":"Question?","passageText":"Passage","questionType":"single_choice",
         "explanation":"Explanation","points":1.00,"sortOrder":0,"imageMediaId":%d}
        """.formatted(imageMediaId);
    return responseId(mvc.perform(post(
            "/api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}/parts/{partId}/questions",
            examId, sessionId, partId).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
  }

  private long createAnswer(
      long examId, long sessionId, long partId, long questionId,
      String text, boolean correct, int sortOrder) throws Exception {
    String body = """
        {"answerText":"%s","isCorrect":%s,"sortOrder":%d}
        """.formatted(text, correct, sortOrder);
    return responseId(mvc.perform(post(
            "/api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/answers",
            examId, sessionId, partId, questionId).with(adminJwt())
            .contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
  }

  private Media media(FileTypeEnum type, String name) {
    return media.save(Media.builder()
        .fileName(name)
        .originalName(name)
        .publicId("jlpt/" + name)
        .secureUrl("https://example.test/" + name)
        .fileType(type)
        .mimeType(type == FileTypeEnum.IMAGE ? "image/png" : "audio/mpeg")
        .fileSize(100L)
        .isUsed(false)
        .build());
  }

  private User user(String email) {
    User user = new User();
    user.setEmail(email);
    user.setUsername(email);
    user.setPassword("hash");
    user.setActive(true);
    user.setVerified(true);
    return users.save(user);
  }

  private long responseId(String response) {
    JsonNode root = JSON.readTree(response);
    return root.get("data").get("id").asLong();
  }

  private String answerPath() {
    return "/api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}/parts/{partId}"
        + "/questions/{questionId}/answers/{answerId}";
  }

  private RequestPostProcessor adminJwt() {
    return jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
  }

  private RequestPostProcessor studentJwt() {
    return jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"));
  }

  private RequestPostProcessor studentJwt(String subject) {
    return jwt().jwt(token -> token.subject(subject))
        .authorities(new SimpleGrantedAuthority("ROLE_STUDENT"));
  }
}
