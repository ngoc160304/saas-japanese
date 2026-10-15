package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
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
import com.mycompany.saas_japanese.domain.UserJlptAttempt;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptSession;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.AdminJlptExamService;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;
import com.mycompany.saas_japanese.util.constant.UserRoleEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import jakarta.persistence.EntityManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

// Requests run in their own real transactions so failed writes can be checked after rollback.
class AdminJlptHierarchyIntegrationTest extends AuthTestSupport {
  private static final String BASE = "/api/v1/admin/jlpt-exams";
  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final List<String> BODIES = List.of(
      "{\"name\":\"Session\",\"sessionType\":\"reading\",\"timeLimitMinutes\":10,\"sortOrder\":0}",
      "{\"name\":\"Part\",\"instructions\":\"Read\",\"sortOrder\":0}",
      "{\"questionText\":\"Question\",\"questionType\":\"single_choice\",\"points\":1,\"sortOrder\":0}",
      "{\"answerText\":\"Answer\",\"isCorrect\":false,\"sortOrder\":0}");
  private static final List<String> COLLECTIONS = List.of("sessions", "parts", "questions", "answers");

  @Autowired private WebApplicationContext context;
  @Autowired private PlatformTransactionManager transactions;
  @Autowired private EntityManager entityManager;
  @Autowired private JlptExamRepository exams;
  @Autowired private JlptExamSessionRepository sessions;
  @Autowired private JlptExamPartRepository parts;
  @Autowired private JlptExamQuestionRepository questions;
  @Autowired private JlptExamAnswerRepository answers;
  @Autowired private MediaRepository media;
  @Autowired private UserRepository users;
  @Autowired private UserJlptAttemptRepository attempts;
  @Autowired private AdminJlptExamService service;

  private final List<Long> examIds = new ArrayList<>();
  private final List<Long> mediaIds = new ArrayList<>();
  private final List<Long> userIds = new ArrayList<>();
  private MockMvc mvc;

  @BeforeEach
  void setup() {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  @AfterEach
  void cleanupOwnFixtures() {
    tx(() -> {
      attempts.deleteAll(attempts.findAll().stream()
          .filter(attempt -> examIds.contains(attempt.getJlptExam().getId())).toList());
      attempts.flush();
      for (Long examId : examIds) {
        List<JlptExamSession> children = sessions.findByJlptExamIdOrderBySortOrderAscIdAsc(examId);
        List<JlptExamPart> examParts = children.isEmpty() ? List.of() : parts.findAdminPartsBySessionIds(
            children.stream().map(JlptExamSession::getId).toList());
        List<JlptExamQuestion> examQuestions = examParts.isEmpty() ? List.of() : questions.findAdminQuestionsByPartIds(
            examParts.stream().map(JlptExamPart::getId).toList());
        if (!examQuestions.isEmpty()) {
          answers.deleteAll(answers.findAdminAnswersByQuestionIds(
              examQuestions.stream().map(JlptExamQuestion::getId).toList()));
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

  @ParameterizedTest
  @ValueSource(ints = {0, 1, 2, 3})
  void completeReordersAreAtomicOrderedAndIdempotent(int depth) throws Exception {
    Fixture fixture = fixture();
    Group group = fixture.groups().get(depth);
    List<Long> expected = List.of(group.ids().get(2), group.ids().get(0), group.ids().get(1));
    JsonNode before = detail(fixture);
    JsonNode response = data(patch(group.path() + "/reorder").content(idsBody(expected)), 200);
    assertOrder(response, expected);
    assertOrder(data(patch(group.path() + "/reorder").content(idsBody(expected)), 200), expected);
    assertStoredOrder(group, expected);
    JsonNode after = detail(fixture);
    for (String field : List.of("sessionCount", "partCount", "questionCount", "totalTimeMinutes")) {
      assertThat(after.get(field)).isEqualTo(before.get(field));
    }
  }

  @ParameterizedTest
  @ValueSource(ints = {0, 1, 2, 3})
  void invalidSiblingListsNeverChangeEitherParent(int depth) throws Exception {
    Fixture fixture = fixture();
    Fixture other = fixture();
    Group group = fixture.groups().get(depth);
    List<Long> ids = group.ids();
    JsonNode before = detail(fixture);
    JsonNode otherBefore = detail(other);
    for (List<Long> invalid : List.of(
        List.of(ids.get(0), ids.get(0), ids.get(2)), List.of(ids.get(0), ids.get(2)),
        List.of(ids.get(0), ids.get(1), ids.get(2), Long.MAX_VALUE),
        List.of(ids.get(0), ids.get(1), Long.MAX_VALUE),
        List.of(ids.get(0), ids.get(1), other.groups().get(depth).ids().get(0)), List.<Long>of())) {
      data(patch(group.path() + "/reorder").content(idsBody(invalid)), 400);
      assertThat(detail(fixture)).isEqualTo(before);
      assertThat(detail(other)).isEqualTo(otherBefore);
      assertStoredOrder(group, ids);
    }
    for (String invalid : List.of("{}", "null", "{", "[]", "{\"ids\":null}", "{\"ids\":[null]}",
        "{\"ids\":[0]}", "{\"ids\":[-1]}", "{\"ids\":[1.5]}", "{\"ids\":[\"1\"]}",
        "{\"ids\":[9223372036854775808]}", "{\"ids\":1}")) {
      data(patch(group.path() + "/reorder").content(invalid), 400);
    }
    assertThat(detail(fixture)).isEqualTo(before);
  }

  @ParameterizedTest
  @ValueSource(ints = {0, 1, 2, 3})
  void insertMovePutAndDeleteShareContiguousOrdering(int depth) throws Exception {
    Fixture fixture = fixture();
    Group group = fixture.groups().get(depth);
    List<Long> ids = group.ids();
    long inserted = data(post(group.path()).content(body(depth, 1)), 201).get("id").asLong();
    assertStoredOrder(group, List.of(ids.get(0), inserted, ids.get(1), ids.get(2)));
    data(patch(group.path() + "/" + ids.get(2) + "/sort-order").content("{\"sortOrder\":0}"), 200);
    assertStoredOrder(group, List.of(ids.get(2), ids.get(0), inserted, ids.get(1)));
    data(put(group.path() + "/" + inserted).content(body(depth, 3)), 200);
    assertStoredOrder(group, List.of(ids.get(2), ids.get(0), ids.get(1), inserted));
    data(delete(group.path() + "/" + ids.get(0)), 204);
    assertStoredOrder(group, List.of(ids.get(2), ids.get(1), inserted));
    JsonNode before = detail(fixture);
    data(post(group.path()).content(body(depth, 4)), 400);
    data(put(group.path() + "/" + inserted).content(body(depth, 3)), 400);
    data(patch(group.path() + "/" + inserted + "/sort-order").content("{\"sortOrder\":3}"), 400);
    assertThat(detail(fixture)).isEqualTo(before);
  }

  @ParameterizedTest
  @ValueSource(ints = {0, 1, 2, 3})
  void emptyAndSingleCollectionsWorkAndMissingIdsAreRejected(int depth) throws Exception {
    Fixture fixture = fixture();
    Group group = fixture.groups().get(depth);
    for (Long id : group.ids().subList(1, 3)) {
      data(delete(group.path() + "/" + id), 204);
    }
    assertOrder(data(patch(group.path() + "/reorder").content(idsBody(List.of(group.ids().get(0)))), 200),
        List.of(group.ids().get(0)));
    data(patch(group.path() + "/reorder").content("{\"ids\":[]}"), 400);
    data(delete(group.path() + "/" + group.ids().get(0)), 204);
    assertOrder(data(patch(group.path() + "/reorder").content("{\"ids\":[]}"), 200), List.of());
    assertStoredOrder(group, List.of());
    data(patch(group.path() + "/reorder").content(idsBody(group.ids())), 400);
  }

  @ParameterizedTest
  @ValueSource(ints = {0, 1, 2, 3})
  void fullPathOwnershipAppliesToReadsWritesDeletionAndReordering(int depth) throws Exception {
    Fixture fixture = fixture();
    Fixture other = fixture();
    Group group = fixture.groups().get(depth);
    JsonNode before = detail(fixture);
    JsonNode otherBefore = detail(other);
    String item = group.path() + "/" + group.ids().get(0);
    List<Long> foreignPathIds = List.of(other.examId(), other.groups().get(0).ids().get(0),
        other.groups().get(1).ids().get(0), other.groups().get(2).ids().get(0),
        other.groups().get(3).ids().get(0));
    for (int ancestor = 0; ancestor <= depth + 1; ancestor++) {
      String wrong = replaceId(item, ancestor, foreignPathIds.get(ancestor));
      data(get(wrong), 404);
      data(put(wrong).content(body(depth, 0)), 404);
      data(patch(wrong + "/sort-order").content("{\"sortOrder\":0}"), 404);
      data(delete(wrong), 404);
    }
    if (depth > 0) {
      for (int ancestor = 0; ancestor <= depth; ancestor++) {
        String wrong = replaceId(group.path(), ancestor, foreignPathIds.get(ancestor));
        data(post(wrong).content(body(depth, 0)), 404);
        data(patch(wrong + "/reorder").content(idsBody(group.ids())), 404);
      }
    }
    assertThat(detail(fixture)).isEqualTo(before);
    assertThat(detail(other)).isEqualTo(otherBefore);
  }

  @Test
  void sessionAndPartCrudNormalizesFieldsAndMaintainsDurationAndCounts() throws Exception {
    Fixture fixture = fixture();
    Group group = fixture.groups().get(0);
    Long moved = group.ids().get(1);
    JsonNode session = data(put(group.path() + "/" + moved).content(
        "{\"name\":\"  Timed  \",\"sessionType\":\"listening\",\"timeLimitMinutes\":40,\"sortOrder\":0}"), 200);
    assertThat(session.get("name").asString()).isEqualTo("Timed");
    assertThat(session.get("sessionType").asString()).isEqualTo("listening");
    assertThat(session.get("timeLimitMinutes").asInt()).isEqualTo(40);
    assertThat(session.get("parts")).isEmpty();
    assertStoredOrder(group, List.of(moved, group.ids().get(0), group.ids().get(2)));
    assertThat(detail(fixture).get("totalTimeMinutes").asInt()).isEqualTo(60);
    data(delete(group.path() + "/" + moved), 204);
    assertThat(exams.findById(fixture.examId()).orElseThrow().getTotalTimeMinutes()).isEqualTo(20);
    group = fixture.groups().get(1);
    moved = group.ids().get(1);
    JsonNode part = data(put(group.path() + "/" + moved)
        .content("{\"name\":\"  Renamed  \",\"instructions\":\"   \",\"sortOrder\":0}"), 200);
    assertThat(part.get("name").asString()).isEqualTo("Renamed");
    assertThat(part.get("instructions").isNull()).isTrue();
    assertThat(part.get("questions")).isEmpty();
    data(delete(group.path() + "/" + moved), 204);
    assertStoredOrder(group, List.of(group.ids().get(0), group.ids().get(2)));
    JsonNode detail = detail(fixture);
    assertThat(detail.get("sessionCount").asInt()).isEqualTo(2);
    assertThat(detail.get("partCount").asInt()).isEqualTo(2);
    assertThat(detail.get("questionCount").asInt()).isEqualTo(3);
    JsonNode omitted = data(post(group.path()).content("{\"name\":\"Omitted order\"}"), 201);
    assertThat(omitted.get("sortOrder").asInt()).isZero();
    assertStoredOrder(group, List.of(omitted.get("id").asLong(), group.ids().get(0), group.ids().get(2)));
  }

  @Test
  void allNewRoutesRequireAdminAndRespectEveryContentLock() throws Exception {
    Fixture fixture = fixture();
    JsonNode before = detail(fixture);
    for (Group group : fixture.groups()) {
      mvc.perform(patch(group.path() + "/reorder").contentType(MediaType.APPLICATION_JSON)
          .content(idsBody(group.ids()))).andExpect(status().isUnauthorized());
      mvc.perform(patch(group.path() + "/reorder").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")))
          .contentType(MediaType.APPLICATION_JSON).content(idsBody(group.ids()))).andExpect(status().isForbidden());
    }
    assertThat(detail(fixture)).isEqualTo(before);
    tx(() -> { exams.findById(fixture.examId()).orElseThrow().setIsPublished(true); return null; });
    rejectAllMutations(fixture, 409);
    tx(() -> {
      JlptExam exam = exams.findById(fixture.examId()).orElseThrow();
      exam.setIsPublished(false);
      User user = new User();
      String email = UUID.randomUUID() + "@example.test";
      user.setEmail(email);
      user.setUsername(email);
      user.setPassword("hash");
      user.setActive(true);
      user.setVerified(true);
      user.setRole(UserRoleEnum.student);
      users.save(user);
      userIds.add(user.getId());
      attempts.save(UserJlptAttempt.builder().jlptExam(exam).user(user).build());
      return null;
    });
    rejectAllMutations(fixture, 409);
    data(delete(BASE + "/" + fixture.examId()), 204);
    rejectAllMutations(fixture, 404);
  }

  @Test
  void legacyOrdersAreReadDeterministicallyAndOnlyTouchedCollectionsAreNormalized() throws Exception {
    Fixture fixture = fixture();
    Fixture other = fixture();
    tx(() -> {
      for (Fixture value : List.of(fixture, other)) {
        sessions.findByJlptExam_IdOrderBySortOrderAsc(value.examId()).forEach(item -> item.setSortOrder(8));
        parts.findByJlptExamSession_IdOrderBySortOrderAsc(value.groups().get(0).ids().get(0))
            .forEach(item -> item.setSortOrder(4));
      }
      return null;
    });
    JsonNode otherBefore = detail(other);
    assertThat(jsonIds(detail(fixture).get("sessions"))).containsExactlyElementsOf(fixture.groups().get(0).ids());
    data(patch(fixture.groups().get(0).path() + "/reorder").content(idsBody(fixture.groups().get(0).ids())), 200);
    assertStoredOrder(fixture.groups().get(0), fixture.groups().get(0).ids());
    assertThat(detail(fixture).get("sessions").get(0).get("parts").get(0).get("sortOrder").asInt()).isEqualTo(4);
    assertThat(detail(other)).isEqualTo(otherBefore);
  }

  @ParameterizedTest
  @ValueSource(ints = {0, 1})
  void deletingPopulatedSessionsOrPartsDeletesAnswersBeforeQuestionsAndReleasesMedia(int depth) throws Exception {
    Fixture fixture = fixture();
    Media audio = newMedia(FileTypeEnum.AUDIO);
    Media image = newMedia(FileTypeEnum.IMAGE);
    attachDirectly(fixture, audio.getId(), image.getId());
    Group group = fixture.groups().get(depth);
    data(delete(group.path() + "/" + group.ids().get(0)), 204);
    assertThat(questions.findById(fixture.groups().get(2).ids().get(0))).isEmpty();
    assertThat(answers.findById(fixture.groups().get(3).ids().get(0))).isEmpty();
    assertThat(media.findById(audio.getId()).orElseThrow().getIsUsed()).isFalse();
    assertThat(media.findById(image.getId()).orElseThrow().getIsUsed()).isFalse();
    JsonNode detail = detail(fixture);
    assertThat(detail.get("questionCount").asInt()).isZero();
    assertThat(detail.get("partCount").asInt()).isEqualTo(depth == 0 ? 0 : 2);
    assertThat(detail.get("totalTimeMinutes").asInt()).isEqualTo(depth == 0 ? 20 : 30);
    assertThat(exams.findById(fixture.examId()).orElseThrow().getTotalTimeMinutes())
        .isEqualTo(detail.get("totalTimeMinutes").asInt());
  }

  @Test
  void sharedLegacyMediaRemainsUsedUntilItsLastReferenceIsRemovedIncludingArchivedContent() throws Exception {
    Fixture fixture = fixture();
    Fixture retained = fixture();
    Media audio = newMedia(FileTypeEnum.AUDIO);
    Media image = newMedia(FileTypeEnum.IMAGE);
    attachDirectly(fixture, audio.getId(), image.getId());
    attachDirectly(retained, audio.getId(), image.getId());
    data(delete(BASE + "/" + retained.examId()), 204);
    data(delete(fixture.groups().get(1).path() + "/" + fixture.groups().get(1).ids().get(0)), 204);
    assertThat(media.findById(audio.getId()).orElseThrow().getIsUsed()).isTrue();
    assertThat(media.findById(image.getId()).orElseThrow().getIsUsed()).isTrue();
    assertThat(detail(retained).get("questionCount").asInt()).isEqualTo(3);
  }

  @Test
  void mediaReplacementChecksReferencesEvenWhenTheLegacyUsageFlagIsWrongAndRollsBackMoves() throws Exception {
    Fixture fixture = fixture();
    Fixture other = fixture();
    Media audio = newMedia(FileTypeEnum.AUDIO);
    Media image = newMedia(FileTypeEnum.IMAGE);
    attachDirectly(fixture, audio.getId(), image.getId());
    tx(() -> { media.findById(audio.getId()).orElseThrow().setIsUsed(false); return null; });
    Group group = other.groups().get(1);
    JsonNode before = detail(other);
    ObjectNode body = (ObjectNode) JSON.readTree(body(1, 2));
    body.put("audioMediaId", audio.getId());
    data(put(group.path() + "/" + group.ids().get(0)).content(JSON.writeValueAsString(body)), 409);
    assertThat(detail(other)).isEqualTo(before);
    assertStoredOrder(group, group.ids());
    Group source = fixture.groups().get(1);
    data(put(source.path() + "/" + source.ids().get(0)).content(body(1, 0)), 200);
    assertThat(media.findById(audio.getId()).orElseThrow().getIsUsed()).isFalse();
    data(delete(fixture.groups().get(2).path() + "/" + fixture.groups().get(2).ids().get(0)), 204);
    assertThat(media.findById(image.getId()).orElseThrow().getIsUsed()).isFalse();
  }

  @Test
  void outerTransactionFailureRollsBackDeletionsDurationMediaAndOrderTogether() throws Exception {
    Fixture fixture = fixture();
    Media audio = newMedia(FileTypeEnum.AUDIO);
    Media image = newMedia(FileTypeEnum.IMAGE);
    attachDirectly(fixture, audio.getId(), image.getId());
    JsonNode before = detail(fixture);
    assertThatThrownBy(() -> tx(() -> {
      service.deleteSession(fixture.examId(), fixture.groups().get(0).ids().get(0));
      entityManager.flush();
      throw new BadRequestException("Force transaction rollback after deletion");
    })).isInstanceOf(BadRequestException.class);
    assertThat(detail(fixture)).isEqualTo(before);
    assertThat(media.findById(audio.getId()).orElseThrow().getIsUsed()).isTrue();
    assertThat(media.findById(image.getId()).orElseThrow().getIsUsed()).isTrue();
    assertThat(exams.findById(fixture.examId()).orElseThrow().getTotalTimeMinutes()).isEqualTo(30);
    assertThatThrownBy(() -> tx(() -> {
      service.reorderAnswers(fixture.examId(), fixture.groups().get(0).ids().get(0),
          fixture.groups().get(1).ids().get(0), fixture.groups().get(2).ids().get(0),
          List.of(fixture.groups().get(3).ids().get(2), fixture.groups().get(3).ids().get(1),
              fixture.groups().get(3).ids().get(0)));
      throw new BadRequestException("Force transaction rollback after reorder");
    })).isInstanceOf(BadRequestException.class);
    assertThat(detail(fixture)).isEqualTo(before);
  }

  @Test
  void concurrentMembershipChangeWaitsForTheDatabaseLockThenRejectsAStaleCompleteList() throws Exception {
    Fixture fixture = fixture();
    CountDownLatch locked = new CountDownLatch(1);
    CountDownLatch release = new CountDownLatch(1);
    CountDownLatch started = new CountDownLatch(1);
    var executor = Executors.newFixedThreadPool(2);
    try {
      var writer = executor.submit(() -> tx(() -> {
        exams.findActiveForUpdate(fixture.examId()).orElseThrow();
        locked.countDown();
        await(release);
        ReqAdminJlptSession request = new ReqAdminJlptSession();
        request.setName("Concurrent");
        request.setSessionType(JlptSessionEnum.reading);
        request.setTimeLimitMinutes(15);
        request.setSortOrder(3);
        return service.createSession(fixture.examId(), request).getId();
      }));
      assertThat(locked.await(10, TimeUnit.SECONDS)).isTrue();
      var staleReorder = executor.submit(() -> {
        started.countDown();
        return data(patch(fixture.groups().get(0).path() + "/reorder")
            .content(idsBody(fixture.groups().get(0).ids())), 400);
      });
      assertThat(started.await(10, TimeUnit.SECONDS)).isTrue();
      assertThatThrownBy(() -> staleReorder.get(250, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
      release.countDown();
      Long inserted = writer.get(10, TimeUnit.SECONDS);
      staleReorder.get(10, TimeUnit.SECONDS);
      List<Long> expected = new ArrayList<>(fixture.groups().get(0).ids());
      expected.add(inserted);
      assertStoredOrder(fixture.groups().get(0), expected);
      assertThat(detail(fixture).get("totalTimeMinutes").asInt()).isEqualTo(45);
    } finally {
      release.countDown();
      executor.shutdownNow();
      assertThat(executor.awaitTermination(15, TimeUnit.SECONDS)).isTrue();
    }
  }

  @Test
  void competingReordersSerializeAndTheLastCompleteRequestWins() throws Exception {
    Fixture fixture = fixture();
    Group group = fixture.groups().get(0);
    CountDownLatch locked = new CountDownLatch(1);
    CountDownLatch release = new CountDownLatch(1);
    CountDownLatch started = new CountDownLatch(1);
    var executor = Executors.newFixedThreadPool(2);
    try {
      var first = executor.submit(() -> tx(() -> {
        service.reorderSessions(fixture.examId(), List.of(group.ids().get(2), group.ids().get(0), group.ids().get(1)));
        locked.countDown();
        await(release);
        return null;
      }));
      assertThat(locked.await(10, TimeUnit.SECONDS)).isTrue();
      var second = executor.submit(() -> {
        started.countDown();
        return data(patch(group.path() + "/reorder").content(idsBody(group.ids())), 200);
      });
      assertThat(started.await(10, TimeUnit.SECONDS)).isTrue();
      assertThatThrownBy(() -> second.get(250, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
      release.countDown();
      first.get(10, TimeUnit.SECONDS);
      assertOrder(second.get(10, TimeUnit.SECONDS), group.ids());
      assertStoredOrder(group, group.ids());
    } finally {
      release.countDown();
      executor.shutdownNow();
      assertThat(executor.awaitTermination(15, TimeUnit.SECONDS)).isTrue();
    }
  }

  @Test
  void competingMediaClaimsHaveOneWinnerAndInvalidInsertRollsBackItsClaim() throws Exception {
    Fixture first = fixture();
    Fixture second = fixture();
    Media audio = newMedia(FileTypeEnum.AUDIO);
    ObjectNode request = (ObjectNode) JSON.readTree(body(1, 4));
    request.put("audioMediaId", audio.getId());
    JsonNode before = detail(first);
    data(post(first.groups().get(1).path()).content(JSON.writeValueAsString(request)), 400);
    assertThat(media.findById(audio.getId()).orElseThrow().getIsUsed()).isFalse();
    assertThat(detail(first)).isEqualTo(before);
    request.put("sortOrder", 0);
    String body = JSON.writeValueAsString(request);
    CountDownLatch start = new CountDownLatch(1);
    var executor = Executors.newFixedThreadPool(2);
    try {
      List<java.util.concurrent.Future<Integer>> claims = new ArrayList<>();
      for (Fixture fixture : List.of(first, second)) {
        claims.add(executor.submit(() -> {
          await(start);
          return mvc.perform(post(fixture.groups().get(1).path())
                  .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                  .contentType(MediaType.APPLICATION_JSON).content(body))
              .andReturn().getResponse().getStatus();
        }));
      }
      start.countDown();
      assertThat(List.of(claims.get(0).get(10, TimeUnit.SECONDS), claims.get(1).get(10, TimeUnit.SECONDS)))
          .containsExactlyInAnyOrder(201, 409);
      assertThat(media.findById(audio.getId()).orElseThrow().getIsUsed()).isTrue();
      assertThat(tx(() -> parts.findAll().stream()
          .filter(part -> audio.getId().equals(part.getAudioMediaId())).count()))
          .isEqualTo(1L);
      for (Fixture fixture : List.of(first, second)) {
        Group group = fixture.groups().get(1);
        String parent = group.path().substring(0, group.path().lastIndexOf('/'));
        List<Long> order = jsonIds(data(get(parent), 200).get("parts"));
        assertStoredOrder(group, order);
      }
    } finally {
      start.countDown();
      executor.shutdownNow();
      assertThat(executor.awaitTermination(15, TimeUnit.SECONDS)).isTrue();
    }
  }

  private void rejectAllMutations(Fixture fixture, int status) throws Exception {
    JsonNode before = detail(fixture);
    for (int depth = 0; depth < 4; depth++) {
      Group group = fixture.groups().get(depth);
      String item = group.path() + "/" + group.ids().get(0);
      data(patch(group.path() + "/reorder").content(idsBody(group.ids())), status);
      data(post(group.path()).content(body(depth, 0)), status);
      data(put(item).content(body(depth, 0)), status);
      data(patch(item + "/sort-order").content("{\"sortOrder\":0}"), status);
      data(delete(item), status);
    }
    assertThat(detail(fixture)).isEqualTo(before);
  }

  private Fixture fixture() {
    return tx(() -> {
      JlptExam exam = exams.save(JlptExam.builder().title("Hierarchy " + UUID.randomUUID())
          .jlptLevel(JlptLevelEnum.N3).totalTimeMinutes(30).build());
      examIds.add(exam.getId());
      List<JlptExamSession> examSessions = new ArrayList<>();
      List<JlptExamPart> sessionParts = new ArrayList<>();
      List<JlptExamQuestion> partQuestions = new ArrayList<>();
      List<JlptExamAnswer> questionAnswers = new ArrayList<>();
      for (int index = 0; index < 3; index++) {
        examSessions.add(sessions.save(JlptExamSession.builder().jlptExam(exam).name("Session " + index)
            .sessionType(JlptSessionEnum.reading).timeLimitMinutes(10).sortOrder(index).build()));
        sessionParts.add(parts.save(JlptExamPart.builder().jlptExamSession(examSessions.get(0))
            .name("Part " + index).sortOrder(index).build()));
        partQuestions.add(questions.save(JlptExamQuestion.builder().jlptExamPart(sessionParts.get(0))
            .questionText("Question " + index).questionType(JlptQuestionEnum.single_choice).sortOrder(index).build()));
        questionAnswers.add(answers.save(JlptExamAnswer.builder().jlptExamQuestion(partQuestions.get(0))
            .answerText("Answer " + index).isCorrect(index == 0).sortOrder(index).build()));
      }
      List<Group> groups = new ArrayList<>();
      String path = BASE + "/" + exam.getId();
      List<List<Long>> ids = List.of(examSessions.stream().map(JlptExamSession::getId).toList(),
          sessionParts.stream().map(JlptExamPart::getId).toList(),
          partQuestions.stream().map(JlptExamQuestion::getId).toList(),
          questionAnswers.stream().map(JlptExamAnswer::getId).toList());
      for (int depth = 0; depth < 4; depth++) {
        path += "/" + COLLECTIONS.get(depth);
        groups.add(new Group(depth, path, ids.get(depth)));
        path += "/" + ids.get(depth).get(0);
      }
      return new Fixture(exam.getId(), groups);
    });
  }

  private Media newMedia(FileTypeEnum type) {
    Media value = media.save(Media.builder().fileName("fixture").originalName("fixture")
        .publicId(UUID.randomUUID().toString()).secureUrl("https://example.test/media")
        .fileType(type).mimeType(type == FileTypeEnum.AUDIO ? "audio/mpeg" : "image/png")
        .fileSize(100L).isUsed(false).build());
    mediaIds.add(value.getId());
    return value;
  }

  private void attachDirectly(Fixture fixture, Long audio, Long image) {
    tx(() -> {
      parts.findById(fixture.groups().get(1).ids().get(0)).orElseThrow().setAudioMediaId(audio);
      questions.findById(fixture.groups().get(2).ids().get(0)).orElseThrow().setImageMediaId(image);
      media.findById(audio).orElseThrow().setIsUsed(true);
      media.findById(image).orElseThrow().setIsUsed(true);
      return null;
    });
  }

  private void assertStoredOrder(Group group, List<Long> ids) throws Exception {
    String parentPath = group.path().substring(0, group.path().lastIndexOf('/'));
    assertOrder(data(get(parentPath), 200).get(COLLECTIONS.get(group.depth())), ids);
    String[] path = group.path().split("/");
    Long parentId = Long.valueOf(path[path.length - 2]);
    List<StoredOrder> stored = tx(() -> switch (group.depth()) {
      case 0 -> sessions.findByJlptExamIdOrderBySortOrderAscIdAsc(parentId).stream()
          .map(item -> new StoredOrder(item.getId(), item.getSortOrder())).toList();
      case 1 -> parts.findByJlptExamSessionIdOrderBySortOrderAscIdAsc(parentId).stream()
          .map(item -> new StoredOrder(item.getId(), item.getSortOrder())).toList();
      case 2 -> questions.findByJlptExamPartIdOrderBySortOrderAscIdAsc(parentId).stream()
          .map(item -> new StoredOrder(item.getId(), item.getSortOrder())).toList();
      default -> answers.findByJlptExamQuestionIdOrderBySortOrderAscIdAsc(parentId).stream()
          .map(item -> new StoredOrder(item.getId(), item.getSortOrder())).toList();
    });
    assertThat(stored).hasSize(ids.size());
    for (int index = 0; index < ids.size(); index++) {
      assertThat(stored.get(index)).isEqualTo(new StoredOrder(ids.get(index), index));
    }
  }

  private void assertOrder(JsonNode nodes, List<Long> ids) {
    assertThat(jsonIds(nodes)).containsExactlyElementsOf(ids);
    for (int index = 0; index < ids.size(); index++) {
      assertThat(nodes.get(index).get("sortOrder").asInt()).isEqualTo(index);
    }
  }

  private List<Long> jsonIds(JsonNode nodes) {
    List<Long> ids = new ArrayList<>();
    nodes.forEach(node -> ids.add(node.get("id").asLong()));
    return ids;
  }

  private JsonNode detail(Fixture fixture) throws Exception {
    return data(get(BASE + "/" + fixture.examId()), 200);
  }

  private JsonNode data(MockHttpServletRequestBuilder request, int expectedStatus) throws Exception {
    String response = mvc.perform(request.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
            .contentType(MediaType.APPLICATION_JSON)).andExpect(status().is(expectedStatus))
        .andReturn().getResponse().getContentAsString();
    if (expectedStatus == 204) {
      return null;
    }
    JsonNode root = JSON.readTree(response);
    return expectedStatus < 400 ? root.get("data") : root;
  }

  private String body(int depth, int position) {
    ObjectNode body = (ObjectNode) JSON.readTree(BODIES.get(depth));
    body.put("sortOrder", position);
    return JSON.writeValueAsString(body);
  }

  private String idsBody(List<Long> ids) {
    return "{\"ids\":" + JSON.writeValueAsString(ids) + "}";
  }

  private String replaceId(String path, int ancestor, Long id) {
    String[] segments = path.split("/");
    segments[5 + ancestor * 2] = id.toString();
    return String.join("/", segments);
  }

  private <T> T tx(Supplier<T> work) {
    return new TransactionTemplate(transactions).execute(transaction -> work.get());
  }

  private void await(CountDownLatch latch) {
    try {
      if (!latch.await(10, TimeUnit.SECONDS)) {
        throw new IllegalStateException("Timed out waiting for test transaction");
      }
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException(exception);
    }
  }

  private record StoredOrder(Long id, int sortOrder) { }
  private record Group(int depth, String path, List<Long> ids) { }
  private record Fixture(Long examId, List<Group> groups) { }
}
