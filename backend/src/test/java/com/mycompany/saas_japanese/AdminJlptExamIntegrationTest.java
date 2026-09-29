package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.UserJlptAttempt;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Transactional
class AdminJlptExamIntegrationTest extends AuthTestSupport {
  private static final JsonMapper JSON = JsonMapper.builder().build();

  @Autowired private WebApplicationContext context;
  @Autowired private JlptExamRepository exams;
  @Autowired private JlptExamSessionRepository sessions;
  @Autowired private JlptExamPartRepository parts;
  @Autowired private JlptExamQuestionRepository questions;
  @Autowired private JlptExamAnswerRepository answers;
  @Autowired private UserJlptAttemptRepository attempts;
  @Autowired private UserRepository users;
  @Autowired private MediaRepository media;

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
        .andExpect(jsonPath("$.message").value(
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
    mvc.perform(get("/api/v1/jlptExams/{examId}/detail", examId).with(studentJwt()))
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

    mvc.perform(delete("/api/v1/admin/jlpt-exams/{examId}", examId).with(adminJwt()))
        .andExpect(status().isNoContent());
    assertThat(attempts.findById(attempt.getId())).isPresent();
    assertThat(exams.findById(examId).orElseThrow().getIsDeleted()).isTrue();
  }

  @Test
  void learnerApisHideDraftsAndStartAttemptUsesAuthenticatedUser() throws Exception {
    long draftId = createExam("Hidden draft", "N5");
    mvc.perform(get("/api/v1/jlptExams/{examId}", draftId).with(studentJwt()))
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
    mvc.perform(post("/api/v1/jlptExams/{examId}/attempts", draftId)
            .with(studentJwt(learner.getEmail())).contentType(MediaType.APPLICATION_JSON)
            .content("{\"userId\":%d,\"mode\":\"full\"}".formatted(another.getId())))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/jlptExams/{examId}/attempts", draftId)
            .with(studentJwt(learner.getEmail())).contentType(MediaType.APPLICATION_JSON)
            .content("{\"userId\":%d,\"mode\":\"full\"}".formatted(learner.getId())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.examId").value(draftId));
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
