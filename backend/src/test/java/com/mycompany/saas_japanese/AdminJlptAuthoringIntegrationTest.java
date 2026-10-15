package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
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
import com.mycompany.saas_japanese.service.UploadService;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;
import com.mycompany.saas_japanese.util.constant.UserRoleEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:jlpt-authoring;MODE=MySQL;DB_CLOSE_DELAY=-1")
class AdminJlptAuthoringIntegrationTest extends AuthTestSupport {
  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final String BASE = "/api/v1/admin/jlpt-exams";
  private static final String AUDIO = "/api/v1/upload/audios";
  private static final String BODY = """
      {"questionText":"<strong>日本語の質問</strong>","passageText":"<p>文章</p>",
       "explanation":"<em>説明</em>","questionType":"single_choice","points":1.25,"sortOrder":0,
       "answers":[{"answerText":"はい","isCorrect":true},{"answerText":"いいえ","isCorrect":false}]}
      """;

  @Autowired private WebApplicationContext context;
  @Autowired private PlatformTransactionManager transactions;
  @Autowired private JlptExamRepository exams;
  @Autowired private JlptExamSessionRepository sessions;
  @Autowired private JlptExamPartRepository parts;
  @Autowired private JlptExamQuestionRepository questions;
  @MockitoSpyBean private JlptExamAnswerRepository answers;
  @Autowired private MediaRepository media;
  @Autowired private UserRepository users;
  @Autowired private UserJlptAttemptRepository attempts;
  @Autowired private UploadService uploads;
  @MockitoBean private Cloudinary cloudinary;
  private final List<Long> examIds = new ArrayList<>();
  private final List<Long> mediaIds = new ArrayList<>();
  private final List<Long> userIds = new ArrayList<>();
  private MockMvc mvc;
  private Uploader uploader;

  @BeforeEach
  void prepareAuthoringTest() throws IOException {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    uploader = mock(Uploader.class);
    when(cloudinary.uploader()).thenReturn(uploader);
    when(uploader.upload(any(), anyMap())).thenAnswer(invocation -> {
      assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
      Map<?, ?> options = invocation.getArgument(1);
      assertThat(options.get("resource_type")).isEqualTo("video");
      assertThat(options.get("folder")).isEqualTo("audios");
      return Map.of("public_id", "test/" + UUID.randomUUID(), "secure_url", "https://example.test/audio.mp3");
    });
  }

  @AfterEach
  void cleanupOwnFixtures() {
    reset(answers);
    tx(() -> {
      attempts.deleteAll(attempts.findAll().stream()
          .filter(attempt -> examIds.contains(attempt.getJlptExam().getId())).toList());
      attempts.flush();
      for (Long examId : examIds) {
        List<JlptExamSession> children = sessions.findByJlptExamIdOrderBySortOrderAscIdAsc(examId);
        List<JlptExamPart> childrenParts = parts.findAdminPartsBySessionIds(
            children.stream().map(JlptExamSession::getId).toList());
        List<JlptExamQuestion> childrenQuestions = questions.findAdminQuestionsByPartIds(
            childrenParts.stream().map(JlptExamPart::getId).toList());
        if (!childrenQuestions.isEmpty()) {
          answers.deleteAll(answers.findAdminAnswersByQuestionIds(
              childrenQuestions.stream().map(JlptExamQuestion::getId).toList()));
          answers.flush();
        }
        exams.findById(examId).ifPresent(exams::delete);
        exams.flush();
      }
      media.deleteAllById(mediaIds);
      users.deleteAllById(userIds);
      return null;
    });
  }

  @Test
  void aggregateCreatePersistsAllAnswersImageAndQuestionPositionWhileExamRemainsDraft() throws Exception {
    Fixture fixture = fixture();
    Media image = newMedia(FileTypeEnum.IMAGE);
    ObjectNode request = body();
    request.put("imageMediaId", image.getId());
    request.put("questionText", "<strong>日本語</strong><script>bad()</script><img src='https://bad.test/x'>");
    JsonNode result = save(post(fixture.createPath()), request, 201);
    assertThat(result.get("questionText").asString()).isEqualTo("<strong>日本語</strong>");
    assertThat(result.get("explanation").asString()).isEqualTo("<em>説明</em>");
    assertThat(result.get("image").get("id").asLong()).isEqualTo(image.getId());
    assertThat(result.get("image").get("secureUrl").asString()).isEqualTo("https://example.test/media");
    assertAnswersStored(result);
    assertThat(media.findById(image.getId()).orElseThrow().getIsUsed()).isTrue();
    JsonNode detail = detail(fixture);
    assertThat(detail.get("status").asString()).isEqualTo("DRAFT");
    assertThat(detail.get("questionCount").asInt()).isEqualTo(3);
    JsonNode ordered = detail.get("sessions").get(0).get("parts").get(0).get("questions");
    assertThat(ordered.get(0).get("id")).isEqualTo(result.get("id"));
    for (int index = 0; index < ordered.size(); index++) {
      assertThat(ordered.get(index).get("sortOrder").asInt()).isEqualTo(index);
    }
  }

  @Test
  void completeUpdateRetainsIdsCreatesNewAnswersDeletesOmittedAndChangesCorrectnessTogether() throws Exception {
    Fixture fixture = fixture();
    JsonNode original = data(get(fixture.questionPath()), 200);
    List<Long> ids = answerIds(original);
    tx(() -> {
      answers.save(JlptExamAnswer.builder().jlptExamQuestion(questions.findById(fixture.questionId()).orElseThrow())
          .answerText("Omitted").sortOrder(2).isCorrect(false).build());
      return null;
    });
    long omitted = answerIds(data(get(fixture.questionPath()), 200)).get(2);
    ObjectNode request = body();
    request.put("sortOrder", 1);
    ArrayNode list = JSON.createArrayNode();
    list.add(answer(ids.get(1), "新しい正解", true, 0));
    list.add(answer(null, "新規", false, 1));
    list.add(answer(ids.get(0), "以前の正解", false, 2));
    request.set("answers", list);
    JsonNode result = save(put(fixture.updatePath()), request, 200);
    assertThat(result.get("id").asLong()).isEqualTo(fixture.questionId());
    assertThat(result.get("sortOrder").asInt()).isEqualTo(1);
    assertThat(answerIds(result).get(0)).isEqualTo(ids.get(1));
    assertThat(answerIds(result).get(2)).isEqualTo(ids.get(0));
    assertThat(answerIds(result).get(1)).isNotIn(ids);
    assertThat(answers.findById(omitted)).isEmpty();
    assertThat(answers.findById(ids.get(0)).orElseThrow().getIsCorrect()).isFalse();
    assertThat(answers.findById(ids.get(1)).orElseThrow().getIsCorrect()).isTrue();
    assertAnswersStored(result);
  }

  @Test
  void legacyQuestionOnlyUpdatesLeaveEveryAnswerUntouched() throws Exception {
    Fixture fixture = fixture();
    JsonNode original = data(get(fixture.questionPath()), 200).get("answers");
    ObjectNode request = body();
    request.remove("answers");
    assertThat(save(put(fixture.questionPath()), request, 200).get("answers")).isEqualTo(original);
    request.set("answers", JSON.createArrayNode());
    assertThat(save(put(fixture.questionPath()), request, 200).get("answers")).isEqualTo(original);
  }

  @Test
  void duplicateUnknownForeignAndCreateTimeAnswerIdsAreRejectedWithoutChanges() throws Exception {
    Fixture fixture = fixture();
    Fixture other = fixture();
    List<Long> own = answerIds(data(get(fixture.questionPath()), 200));
    Long foreign = answerIds(data(get(other.questionPath()), 200)).get(0);
    JsonNode before = detail(fixture);
    JsonNode otherBefore = detail(other);
    for (Long second : List.of(own.get(0), Long.MAX_VALUE, foreign)) {
      ObjectNode request = body();
      request.set("answers", JSON.createArrayNode().add(answer(own.get(0), "Correct", true, 0))
          .add(answer(second, "Wrong", false, 1)));
      save(put(fixture.updatePath()), request, 400);
      save(post(fixture.createPath()), request, 400);
      assertThat(detail(fixture)).isEqualTo(before);
      assertThat(detail(other)).isEqualTo(otherBefore);
    }
  }

  @Test
  void incompleteInvalidOrUnsafeBodiesCannotPartiallySaveQuestions() throws Exception {
    Fixture fixture = fixture();
    List<ObjectNode> invalid = new ArrayList<>();
    ObjectNode missing = body(); missing.remove("answers"); invalid.add(missing);
    for (String value : List.of("null", "[]", "[null,null]", "[{\"answerText\":\"Only\",\"isCorrect\":true}]")) {
      ObjectNode request = body(); request.set("answers", JSON.readTree(value)); invalid.add(request);
    }
    for (String field : List.of("questionText", "questionType", "points", "sortOrder")) {
      ObjectNode request = body(); request.putNull(field); invalid.add(request);
    }
    for (String value : List.of("0", "-1", "1000", "1.234", "\"1.00\"")) {
      ObjectNode request = body(); request.set("points", JSON.readTree(value)); invalid.add(request);
    }
    for (String value : List.of("-1", "3", "1.5", "\"0\"")) {
      ObjectNode request = body(); request.set("sortOrder", JSON.readTree(value)); invalid.add(request);
    }
    for (String text : List.of(" ", "<script>bad()</script>", "<p><br></p>", "x".repeat(20001))) {
      ObjectNode request = body(); request.put("questionText", text); invalid.add(request);
    }
    for (String type : List.of("\"multiple_choice\"", "0", "\"0\"")) {
      ObjectNode request = body(); request.set("questionType", JSON.readTree(type)); invalid.add(request);
    }
    for (String value : List.of("0", "-1", "1.5", "\"1\"")) {
      ObjectNode request = body(); request.set("imageMediaId", JSON.readTree(value)); invalid.add(request);
    }
    for (String text : List.of(" ", "<script>x</script>", "<p></p>", "x".repeat(501))) {
      ObjectNode request = body(); ((ObjectNode) request.get("answers").get(0)).put("answerText", text);
      invalid.add(request);
    }
    for (String field : List.of("answerText", "isCorrect")) {
      ObjectNode request = body(); ((ObjectNode) request.get("answers").get(0)).putNull(field); invalid.add(request);
    }
    for (boolean correct : List.of(true, false)) {
      ObjectNode request = body();
      request.get("answers").forEach(item -> ((ObjectNode) item).put("isCorrect", correct)); invalid.add(request);
    }
    for (String value : List.of("-1", "1", "\"0\"")) {
      ObjectNode request = body();
      ((ObjectNode) request.get("answers").get(0)).set("sortOrder", JSON.readTree(value)); invalid.add(request);
    }
    for (String value : List.of("0", "-1", "1.5", "\"1\"", "9223372036854775808")) {
      ObjectNode request = body();
      ((ObjectNode) request.get("answers").get(0)).set("id", JSON.readTree(value)); invalid.add(request);
    }
    for (String field : List.of("passageText", "explanation")) {
      ObjectNode request = body();
      request.put(field, "x".repeat(field.equals("passageText") ? 50001 : 20001)); invalid.add(request);
    }
    JsonNode before = detail(fixture);
    for (ObjectNode request : invalid) {
      save(post(fixture.createPath()), request, 400);
      save(put(fixture.updatePath()), request, 400);
      assertThat(detail(fixture)).isEqualTo(before);
    }
    for (String malformed : List.of("", "null", "{", "[]")) {
      data(post(fixture.createPath()).content(malformed), 400);
      data(put(fixture.updatePath()).content(malformed), 400);
    }
  }

  @Test
  void aggregateOwnershipAndAuthorizationApplyToTheEntirePath() throws Exception {
    Fixture fixture = fixture();
    Fixture other = fixture();
    for (String path : List.of(fixture.createPath(), fixture.updatePath())) {
      var request = path.equals(fixture.createPath()) ? post(path) : put(path);
      mvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isUnauthorized());
      request = path.equals(fixture.createPath()) ? post(path) : put(path);
      mvc.perform(request.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")))
          .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
    }
    List<Long> foreign = List.of(other.examId(), other.sessionId(), other.partId(), other.questionId());
    JsonNode before = detail(fixture);
    JsonNode otherBefore = detail(other);
    for (int depth = 0; depth < 4; depth++) {
      String[] path = fixture.updatePath().split("/");
      path[5 + depth * 2] = foreign.get(depth).toString();
      save(put(String.join("/", path)), body(), 404);
      if (depth < 3) {
        path = fixture.createPath().split("/");
        path[5 + depth * 2] = foreign.get(depth).toString();
        save(post(String.join("/", path)), body(), 404);
      }
    }
    assertThat(detail(fixture)).isEqualTo(before);
    assertThat(detail(other)).isEqualTo(otherBefore);
  }

  @Test
  void publishedAttemptedAndArchivedExamsCannotUseAggregateSave() throws Exception {
    Fixture fixture = fixture();
    tx(() -> { exams.findById(fixture.examId()).orElseThrow().setIsPublished(true); return null; });
    rejectSave(fixture, 409);
    tx(() -> {
      JlptExam exam = exams.findById(fixture.examId()).orElseThrow(); exam.setIsPublished(false);
      User user = new User();
      String email = UUID.randomUUID() + "@example.test";
      user.setEmail(email); user.setUsername(email); user.setPassword("hash");
      user.setActive(true); user.setVerified(true); user.setRole(UserRoleEnum.student);
      users.save(user); userIds.add(user.getId());
      attempts.save(UserJlptAttempt.builder().jlptExam(exam).user(user).build()); return null;
    });
    rejectSave(fixture, 409);
    data(delete(BASE + "/" + fixture.examId()), 204);
    rejectSave(fixture, 404);
  }

  @Test
  void imageKeepReplaceRemoveAndSharedReferencesPreserveUsageAndAnswerIds() throws Exception {
    Fixture fixture = fixture();
    Fixture other = fixture();
    Media first = newMedia(FileTypeEnum.IMAGE);
    Media second = newMedia(FileTypeEnum.IMAGE);
    ObjectNode request = body(); request.put("imageMediaId", first.getId());
    JsonNode result = save(put(fixture.updatePath()), request, 200);
    List<Long> ids = answerIds(result);
    request = requestFor(result);
    assertThat(answerIds(save(put(fixture.updatePath()), request, 200))).isEqualTo(ids);
    tx(() -> { questions.findById(other.questionId()).orElseThrow().setImageMediaId(first.getId()); return null; });
    request.put("imageMediaId", second.getId());
    result = save(put(fixture.updatePath()), request, 200);
    assertThat(answerIds(result)).isEqualTo(ids);
    assertThat(media.findById(first.getId()).orElseThrow().getIsUsed()).isTrue();
    assertThat(media.findById(second.getId()).orElseThrow().getIsUsed()).isTrue();
    request.putNull("imageMediaId");
    assertThat(save(put(fixture.updatePath()), request, 200).get("image").isNull()).isTrue();
    assertThat(media.findById(second.getId()).orElseThrow().getIsUsed()).isFalse();
    ObjectNode legacy = body(); legacy.remove("answers");
    save(put(other.questionPath()), legacy, 200);
    assertThat(media.findById(first.getId()).orElseThrow().getIsUsed()).isFalse();
  }

  @Test
  void keepingAnImageStillRequiresActiveMedia() throws Exception {
    Fixture fixture = fixture();
    Media image = newMedia(FileTypeEnum.IMAGE);
    ObjectNode request = body(); request.put("imageMediaId", image.getId());
    JsonNode saved = save(put(fixture.updatePath()), request, 200);
    tx(() -> { media.findById(image.getId()).orElseThrow().setIsDeleted(true); return null; });
    JsonNode before = detail(fixture);
    save(put(fixture.updatePath()), requestFor(saved), 404);
    assertThat(detail(fixture)).isEqualTo(before);
    assertThat(media.findById(image.getId()).orElseThrow().getIsUsed()).isTrue();
  }

  @Test
  void invalidMissingDeletedOrUsedImagesFailBeforeChangingQuestionAndAnswers() throws Exception {
    Fixture fixture = fixture();
    Fixture other = fixture();
    Media used = newMedia(FileTypeEnum.IMAGE);
    ObjectNode reference = body(); reference.put("imageMediaId", used.getId());
    save(put(other.updatePath()), reference, 200);
    Media deleted = newMedia(FileTypeEnum.IMAGE);
    tx(() -> { media.findById(deleted.getId()).orElseThrow().setIsDeleted(true); return null; });
    JsonNode before = detail(fixture);
    for (FileTypeEnum type : List.of(FileTypeEnum.AUDIO, FileTypeEnum.VIDEO)) {
      ObjectNode request = body(); request.put("imageMediaId", newMedia(type).getId());
      save(put(fixture.updatePath()), request, 400);
    }
    for (Long id : List.of(Long.MAX_VALUE, deleted.getId())) {
      ObjectNode request = body(); request.put("imageMediaId", id);
      save(post(fixture.createPath()), request, 404);
      save(put(fixture.updatePath()), request, 404);
    }
    reference.put("sortOrder", 1);
    save(put(fixture.updatePath()), reference, 409);
    assertThat(detail(fixture)).isEqualTo(before);
    assertThat(media.findById(used.getId()).orElseThrow().getIsUsed()).isTrue();
  }

  @Test
  void databaseFailureRollsBackCreateUpdateAnswerReplacementSiblingOrderAndMediaTogether() throws Exception {
    Fixture fixture = fixture();
    Media old = newMedia(FileTypeEnum.IMAGE);
    Media replacement = newMedia(FileTypeEnum.IMAGE);
    ObjectNode initial = body(); initial.put("imageMediaId", old.getId());
    JsonNode saved = save(put(fixture.updatePath()), initial, 200);
    JsonNode before = detail(fixture);
    ObjectNode request = requestFor(saved);
    request.put("imageMediaId", replacement.getId()); request.put("sortOrder", 1);
    request.set("answers", JSON.createArrayNode()
        .add(answer(answerIds(saved).get(1), "Changed correct", true, 0))
        .add(answer(null, "New answer", false, 1)));
    doThrow(new DataIntegrityViolationException("Simulated answer flush failure")).when(answers).flush();
    try {
      save(put(fixture.updatePath()), request, 409);
      request = body(); request.put("imageMediaId", replacement.getId());
      save(post(fixture.createPath()), request, 409);
    } finally {
      reset(answers);
    }
    assertThat(detail(fixture)).isEqualTo(before);
    assertThat(media.findById(old.getId()).orElseThrow().getIsUsed()).isTrue();
    assertThat(media.findById(replacement.getId()).orElseThrow().getIsUsed()).isFalse();
    assertAnswersStored(saved);
  }

  @Test
  void audioUploadIsAdminOnlyAndValidationNeverCallsRemoteStorage() throws Exception {
    MockMultipartFile valid = audioFile("listen.wav", "audio/wav", AudioTestFiles.wav());
    mvc.perform(multipart(AUDIO).file(valid)).andExpect(status().isUnauthorized());
    mvc.perform(multipart(AUDIO).file(valid).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
        .andExpect(status().isForbidden());
    data(multipart(AUDIO), 400);
    data(multipart(AUDIO).file(audioFile("empty.wav", "audio/wav", new byte[0])), 400);
    data(multipart(AUDIO).file(audioFile("bad.wav", "audio/wav", new byte[] {1, 2, 3})), 400);
    data(post(AUDIO).content("{}"), 415);
    verifyNoInteractions(uploader);
    JsonNode result = upload(valid);
    Media stored = media.findById(result.get("id").asLong()).orElseThrow();
    assertThat(stored.getFileType()).isEqualTo(FileTypeEnum.AUDIO);
    assertThat(stored.getIsUsed()).isFalse();
    assertThat(stored.getIsDeleted()).isFalse();
    assertThat(stored.getFileSize()).isEqualTo(48L);
    assertThat(result.get("secureUrl").asString()).isEqualTo("https://example.test/audio.mp3");
  }

  @Test
  void uploadedAudioCanBeKeptReplacedRemovedAndCannotBeUsedAsQuestionImage() throws Exception {
    Fixture fixture = fixture();
    Long first = upload(audioFile("listen.wav", "audio/wav", AudioTestFiles.wav())).get("id").asLong();
    Long second = upload(audioFile("listen.mp3", "audio/mpeg", AudioTestFiles.mp3())).get("id").asLong();
    ObjectNode part = (ObjectNode) JSON.readTree("{\"name\":\"Listening\",\"sortOrder\":0}");
    part.put("audioMediaId", first);
    assertThat(save(put(fixture.partPath()), part, 200).get("audio").get("id").asLong()).isEqualTo(first);
    assertThat(media.findById(first).orElseThrow().getIsUsed()).isTrue();
    part.put("audioMediaId", second);
    save(put(fixture.partPath()), part, 200);
    save(put(fixture.partPath()), part, 200);
    assertThat(media.findById(first).orElseThrow().getIsUsed()).isFalse();
    assertThat(media.findById(second).orElseThrow().getIsUsed()).isTrue();
    part.putNull("audioMediaId");
    assertThat(save(put(fixture.partPath()), part, 200).get("audio").isNull()).isTrue();
    assertThat(media.findById(second).orElseThrow().getIsUsed()).isFalse();
    JsonNode before = detail(fixture);
    for (FileTypeEnum type : List.of(FileTypeEnum.IMAGE, FileTypeEnum.VIDEO)) {
      part.put("audioMediaId", newMedia(type).getId());
      save(put(fixture.partPath()), part, 400);
    }
    ObjectNode question = body(); question.put("imageMediaId", first);
    save(post(fixture.createPath()), question, 400);
    assertThat(detail(fixture)).isEqualTo(before);
    assertThat(media.findById(first)).isPresent();
    assertThat(media.findById(first).orElseThrow().getIsUsed()).isFalse();
  }

  @Test
  void remoteUploadAndItsUnusedRecordRemainSeparateFromLaterDatabaseRollback() throws Exception {
    AtomicLong id = new AtomicLong();
    assertThatThrownBy(() -> tx(() -> {
      id.set(uploads.uploadAudio(audioFile("listen.wav", "audio/wav", AudioTestFiles.wav())).getId());
      throw new BadRequestException("Force rollback of caller transaction");
    })).isInstanceOf(BadRequestException.class);
    mediaIds.add(id.get());
    assertThat(media.findById(id.get())).isPresent();
    assertThat(media.findById(id.get()).orElseThrow().getIsUsed()).isFalse();
    long before = media.count();
    doThrow(new IOException("Simulated provider failure")).when(uploader).upload(any(), anyMap());
    data(multipart(AUDIO).file(audioFile("listen.wav", "audio/wav", AudioTestFiles.wav())), 400);
    assertThat(media.count()).isEqualTo(before);
  }

  private void rejectSave(Fixture fixture, int status) throws Exception {
    JsonNode before = detail(fixture);
    save(post(fixture.createPath()), body(), status);
    save(put(fixture.updatePath()), body(), status);
    assertThat(detail(fixture)).isEqualTo(before);
  }

  private void assertAnswersStored(JsonNode question) {
    List<JlptExamAnswer> stored = answers.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(question.get("id").asLong());
    assertThat(stored.stream().map(JlptExamAnswer::getId).toList()).isEqualTo(answerIds(question));
    assertThat(stored).hasSize(question.get("answers").size());
    for (int index = 0; index < stored.size(); index++) {
      assertThat(stored.get(index).getSortOrder()).isEqualTo(index);
      assertThat(stored.get(index).getAnswerText())
          .isEqualTo(question.get("answers").get(index).get("answerText").asString());
      assertThat(stored.get(index).getIsCorrect())
          .isEqualTo(question.get("answers").get(index).get("isCorrect").asBoolean());
    }
  }

  private Fixture fixture() {
    return tx(() -> {
      JlptExam exam = exams.save(JlptExam.builder().title("Authoring " + UUID.randomUUID())
          .jlptLevel(JlptLevelEnum.N3).totalTimeMinutes(10).build());
      examIds.add(exam.getId());
      JlptExamSession session = sessions.save(JlptExamSession.builder().jlptExam(exam).name("Session")
          .sessionType(JlptSessionEnum.reading).timeLimitMinutes(10).sortOrder(0).build());
      JlptExamPart part = parts.save(JlptExamPart.builder().jlptExamSession(session).name("Part").sortOrder(0).build());
      JlptExamQuestion question = questions.save(JlptExamQuestion.builder().jlptExamPart(part).questionText("Legacy")
          .questionType(JlptQuestionEnum.single_choice).sortOrder(0).build());
      for (int index = 0; index < 2; index++) {
        answers.save(JlptExamAnswer.builder().jlptExamQuestion(question).answerText("Answer " + index)
            .sortOrder(index).isCorrect(index == 0).build());
      }
      questions.save(JlptExamQuestion.builder().jlptExamPart(part).questionText("Incomplete draft question")
          .questionType(JlptQuestionEnum.single_choice).sortOrder(1).build());
      return new Fixture(exam.getId(), session.getId(), part.getId(), question.getId());
    });
  }

  private Media newMedia(FileTypeEnum type) {
    Media value = media.save(Media.builder().fileName("fixture").originalName("fixture")
        .publicId(UUID.randomUUID().toString()).secureUrl("https://example.test/media")
        .fileType(type).mimeType(type == FileTypeEnum.IMAGE ? "image/png" : "audio/mpeg")
        .fileSize(100L).isUsed(false).build());
    mediaIds.add(value.getId());
    return value;
  }

  private JsonNode upload(MockMultipartFile file) throws Exception {
    JsonNode result = data(multipart(AUDIO).file(file), 200);
    mediaIds.add(result.get("id").asLong());
    return result;
  }

  private MockMultipartFile audioFile(String name, String mime, byte[] bytes) {
    return new MockMultipartFile("file", name, mime, bytes);
  }

  private ObjectNode requestFor(JsonNode response) {
    ObjectNode request = body();
    for (String field : List.of("questionText", "passageText", "explanation", "questionType", "points", "sortOrder")) {
      request.set(field, response.get(field));
    }
    request.set("answers", response.get("answers"));
    request.set("imageMediaId", response.get("image").isNull() ? JSON.nullNode() : response.get("image").get("id"));
    return request;
  }

  private ObjectNode answer(Long id, String text, boolean correct, int order) {
    ObjectNode answer = JSON.createObjectNode();
    if (id != null) {
      answer.put("id", id);
    }
    answer.put("answerText", text); answer.put("isCorrect", correct); answer.put("sortOrder", order);
    return answer;
  }

  private ObjectNode body() {
    return (ObjectNode) JSON.readTree(BODY);
  }

  private List<Long> answerIds(JsonNode question) {
    List<Long> ids = new ArrayList<>();
    question.get("answers").forEach(answer -> ids.add(answer.get("id").asLong()));
    return ids;
  }

  private JsonNode detail(Fixture fixture) throws Exception {
    return data(get(BASE + "/" + fixture.examId()), 200);
  }

  private JsonNode save(MockHttpServletRequestBuilder request, ObjectNode body, int status) throws Exception {
    return data(request.content(JSON.writeValueAsString(body)), status);
  }

  private JsonNode data(AbstractMockHttpServletRequestBuilder<?> request, int expectedStatus) throws Exception {
    if (!(request instanceof MockMultipartHttpServletRequestBuilder)) {
      request.contentType(MediaType.APPLICATION_JSON);
    }
    String response = mvc.perform(request.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
        .andExpect(status().is(expectedStatus)).andReturn().getResponse().getContentAsString();
    if (expectedStatus == 204) {
      return null;
    }
    JsonNode root = JSON.readTree(response);
    return expectedStatus < 400 ? root.get("data") : root;
  }

  private <T> T tx(Supplier<T> work) {
    return new TransactionTemplate(transactions).execute(transaction -> work.get());
  }

  private record Fixture(Long examId, Long sessionId, Long partId, Long questionId) {
    String partPath() { return BASE + "/" + examId + "/sessions/" + sessionId + "/parts/" + partId; }
    String questionPath() { return partPath() + "/questions/" + questionId; }
    String createPath() { return partPath() + "/questions/with-answers"; }
    String updatePath() { return questionPath() + "/with-answers"; }
  }
}
