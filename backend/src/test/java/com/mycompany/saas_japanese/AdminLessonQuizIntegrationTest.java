package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Quiz;
import com.mycompany.saas_japanese.domain.QuizQuestion;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.QuizOptionRepository;
import com.mycompany.saas_japanese.repository.QuizQuestionRepository;
import com.mycompany.saas_japanese.repository.QuizRepository;
import com.mycompany.saas_japanese.util.constant.QuizQuestionTypeEnum;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

// Deliberately no enclosing test transaction: each HTTP call commits/rolls back independently.
class AdminLessonQuizIntegrationTest extends AuthTestSupport {
  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final String METADATA = "{\"title\":\"  Lesson quiz  \",\"description\":\"  Practice  \"}";
  @Autowired private WebApplicationContext context;
  @Autowired private LessonRepository lessons;
  @Autowired private CourseRepository courses;
  @Autowired private CourseCategoryRepository categories;
  @Autowired private QuizRepository quizzes;
  @Autowired private QuizQuestionRepository questions;
  @Autowired private QuizOptionRepository options;
  @Autowired private PlatformTransactionManager transactions;
  @Autowired private JdbcTemplate jdbc;
  private MockMvc mvc;
  private Lesson lesson;

  @BeforeEach
  void setup() {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    String slug = UUID.randomUUID().toString();
    CourseCategory category = categories.save(CourseCategory.builder().name("Quiz tests").slug(slug).build());
    Course course = courses.save(Course.builder().category(category).title("Quiz tests").slug(slug)
        .price(BigDecimal.ZERO).build());
    lesson = lessons.save(Lesson.builder().course(course).title("Draft").slug(slug).grammar("Keep draft").build());
  }

  @Test
  void lifecycleIncludesEmptyDraftMetadataPublicationAndSoftDelete() throws Exception {
    admin(get(base()), null).andExpect(status().isNoContent()).andExpect(content().string(""));
    long id = createQuiz();
    admin(get(base()), null).andExpect(status().isOk()).andExpect(jsonPath("$.data.title").value("Lesson quiz"))
        .andExpect(jsonPath("$.data.isPublished").value(false)).andExpect(jsonPath("$.data.questions").isEmpty())
        .andExpect(jsonPath("$.data.lessonId").value(lesson.getId()));
    admin(post(base()), METADATA).andExpect(status().isConflict());
    publication(id, true).andExpect(status().isConflict());
    long questionId = addQuestion(id);
    publication(id, true).andExpect(status().isOk()).andExpect(jsonPath("$.data.isPublished").value(true));
    admin(put(path(id)), "{\"title\":\"Updated\",\"description\":\"\"}").andExpect(status().isOk())
        .andExpect(jsonPath("$.data.isPublished").value(true))
        .andExpect(jsonPath("$.data.questions[0].id").value(questionId));
    assertThat(lessons.findById(lesson.getId()).orElseThrow().getIsPublished()).isFalse();
    assertThat(lessons.findById(lesson.getId()).orElseThrow().getGrammar()).isEqualTo("Keep draft");
    publication(id, false).andExpect(status().isOk()).andExpect(jsonPath("$.data.questions.length()").value(1));
    admin(delete(path(id)), null).andExpect(status().isNoContent());
    assertThat(quizzes.findById(id).orElseThrow().getDeletedAt()).isNotNull();
    assertThat(questions.findById(questionId)).isPresent();
    admin(get(base()), null).andExpect(status().isNoContent());
    admin(put(path(id)), METADATA).andExpect(status().isNotFound());
    admin(delete(path(id)), null).andExpect(status().isNotFound());
    assertThat(createQuiz()).isNotEqualTo(id);
  }

  @Test
  void allAdminOperationsRequireAdmin() throws Exception {
    long id = createQuiz();
    List<MockHttpServletRequestBuilder> requests = List.of(get(base()), post(base()), put(path(id)),
        patch(path(id) + "/publication"), delete(path(id)), post(path(id) + "/questions"),
        put(path(id) + "/questions/1"), delete(path(id) + "/questions/1"), put(path(id) + "/questions/order"));
    for (MockHttpServletRequestBuilder request : requests) {
      mvc.perform(request.contentType(MediaType.APPLICATION_JSON).content("{}"))
          .andExpect(status().isUnauthorized());
      mvc.perform(request.with(student()).contentType(MediaType.APPLICATION_JSON).content("{}"))
          .andExpect(status().isForbidden());
    }
  }

  @Test
  void parentsAndOptionOwnershipCannotBeChangedThroughNestedPaths() throws Exception {
    long id = createQuiz();
    long questionId = addQuestion(id);
    long otherQuestion = addQuestion(id);
    long foreignOption = options.findByQuestionIdOrderBySortOrderAsc(otherQuestion).get(0).getId();
    admin(put(path(id) + "/questions/" + questionId), questionBody(foreignOption, null, true, false))
        .andExpect(status().isBadRequest());
    long ownOption = options.findByQuestionIdOrderBySortOrderAsc(questionId).get(0).getId();
    admin(put(path(id) + "/questions/" + questionId), questionBody(ownOption, ownOption, true, false))
        .andExpect(status().isBadRequest());
    Lesson other = lessons.save(Lesson.builder().course(lesson.getCourse()).title("Other")
        .slug(UUID.randomUUID().toString()).build());
    String otherBase = "/api/v1/admin/lessons/" + other.getId() + "/quiz";
    admin(put(otherBase + "/" + id), METADATA).andExpect(status().isNotFound());
    long otherQuiz = data(admin(post(otherBase), METADATA).andExpect(status().isCreated())).get("id").asLong();
    admin(put(otherBase + "/" + otherQuiz + "/questions/" + questionId), validQuestion())
        .andExpect(status().isNotFound());
    admin(delete(otherBase + "/" + otherQuiz + "/questions/" + questionId), null)
        .andExpect(status().isNotFound());
    admin(get("/api/v1/admin/lessons/999999999/quiz"), null).andExpect(status().isNotFound());
    admin(post("/api/v1/admin/lessons/999999999/quiz"), METADATA).andExpect(status().isNotFound());
    lesson.setIsDeleted(true);
    lessons.saveAndFlush(lesson);
    admin(get(base()), null).andExpect(status().isNotFound());
    admin(post(base()), METADATA).andExpect(status().isNotFound());
    admin(put(path(id)), METADATA).andExpect(status().isNotFound());
  }

  @Test
  void validationAndAtomicOptionReplacementPreserveIdsAndRollback() throws Exception {
    admin(post(base()), "{\"title\":\" \",\"description\":null}").andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fieldErrors.title").exists()).andExpect(jsonPath("$.fieldErrors.description").exists());
    long id = createQuiz();
    String endpoint = path(id) + "/questions";
    admin(post(endpoint), questionBody(null, null, false, false)).andExpect(status().isBadRequest());
    admin(post(endpoint), questionBody(null, null, true, true)).andExpect(status().isBadRequest());
    admin(post(endpoint), validQuestion().replace("SINGLE_CHOICE", "MULTIPLE_CHOICE"))
        .andExpect(status().isBadRequest());
    admin(post(endpoint), "{\"questionText\":\"q\",\"questionType\":\"SINGLE_CHOICE\",\"options\":[]}")
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.options").exists());
    admin(post(endpoint), validQuestion().replace("  First  ", "   ")).andExpect(status().isBadRequest());
    admin(post(endpoint), validQuestion().replace("  First  ", "x".repeat(501))).andExpect(status().isBadRequest());
    admin(post(endpoint), validQuestion().replace("Question", "日".repeat(22000)))
        .andExpect(status().isBadRequest());
    long questionId = addQuestion(id);
    var before = options.findByQuestionIdOrderBySortOrderAsc(questionId);
    long retained = before.get(0).getId();
    long removed = before.get(1).getId();
    admin(put(endpoint + "/" + questionId), questionBody(retained, null, false, false))
        .andExpect(status().isBadRequest());
    assertThat(options.findById(removed)).isPresent();
    assertThat(options.findById(retained).orElseThrow().getIsCorrect()).isTrue();
    admin(put(endpoint + "/" + questionId), questionBody(null, retained, false, true))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.questions[0].options[1].id").value(retained));
    assertThat(options.findById(removed)).isEmpty();
    assertThat(options.findById(retained).orElseThrow().getSortOrder()).isEqualTo(1);
    assertThat(options.findByQuestionIdOrderBySortOrderAsc(questionId)).hasSize(2);
    assertThat(questions.findById(questionId).orElseThrow().getQuestionText()).isEqualTo("Question");
    admin(delete(endpoint + "/" + questionId), null).andExpect(status().isNoContent());
    assertThat(questions.findById(questionId).orElseThrow().getDeletedAt()).isNotNull();
    assertThat(options.findById(retained)).isPresent();
    admin(put(endpoint + "/" + questionId), validQuestion()).andExpect(status().isNotFound());
  }

  @Test
  void orderingRequiresEveryActiveIdOnce() throws Exception {
    long id = createQuiz();
    long first = addQuestion(id);
    long second = addQuestion(id);
    admin(put(path(id) + "/questions/order"), "{\"questionIds\":[" + second + "," + first + "]}")
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.questions[0].id").value(second))
        .andExpect(jsonPath("$.data.questions[0].sortOrder").value(0))
        .andExpect(jsonPath("$.data.questions[1].sortOrder").value(1));
    for (String ids : List.of("[]", "[" + first + "]", "[" + first + "," + first + "]",
        "[" + first + ",999999999]", "[null]")) {
      admin(put(path(id) + "/questions/order"), "{\"questionIds\":" + ids + "}")
          .andExpect(status().isBadRequest());
    }
    admin(delete(path(id) + "/questions/" + first), null).andExpect(status().isNoContent());
    admin(put(path(id) + "/questions/order"), "{\"questionIds\":[" + second + "," + first + "]}")
        .andExpect(status().isBadRequest());
    long third = addQuestion(id);
    assertThat(questions.findById(third).orElseThrow().getSortOrder()).isEqualTo(1);
  }

  @Test
  void publishedQuizCannotLoseLastQuestionAndInvalidLegacyChangesRollback() throws Exception {
    long id = createQuiz();
    long questionId = addQuestion(id);
    publication(id, true).andExpect(status().isOk());
    admin(delete(path(id) + "/questions/" + questionId), null).andExpect(status().isConflict());
    assertThat(questions.findById(questionId).orElseThrow().getDeletedAt()).isNull();
    assertThat(quizzes.findById(id).orElseThrow().getIsPublished()).isTrue();
    // Simulate pre-existing invalid published data; a failed write must roll back option replacement too.
    QuizQuestion legacy = questions.saveAndFlush(QuizQuestion.builder().quiz(quizzes.findById(id).orElseThrow())
        .questionText("Legacy").questionType(QuizQuestionTypeEnum.MULTIPLE_CHOICE).sortOrder(10).build());
    List<Long> oldIds = options.findByQuestionIdOrderBySortOrderAsc(questionId).stream().map(o -> o.getId()).toList();
    admin(put(path(id) + "/questions/" + questionId), validQuestion()).andExpect(status().isConflict());
    assertThat(options.findByQuestionIdOrderBySortOrderAsc(questionId).stream().map(o -> o.getId()).toList())
        .containsExactlyElementsOf(oldIds);
    admin(put(path(id)), "{\"title\":\"Should rollback\",\"description\":\"\"}")
        .andExpect(status().isConflict());
    assertThat(quizzes.findById(id).orElseThrow().getTitle()).isEqualTo("Lesson quiz");
    publication(id, false).andExpect(status().isOk());
    assertThat(questions.findById(legacy.getId()).orElseThrow().getQuestionType())
        .isEqualTo(QuizQuestionTypeEnum.MULTIPLE_CHOICE);
    admin(delete(path(id) + "/questions/" + questionId), null).andExpect(status().isNoContent());
  }

  @Test
  void unsupportedRecordsAreInspectableButCannotBeAuthoredOrPublished() throws Exception {
    long id = createQuiz();
    QuizQuestion legacy = questions.saveAndFlush(QuizQuestion.builder().quiz(quizzes.findById(id).orElseThrow())
        .questionText("Legacy").questionType(QuizQuestionTypeEnum.MULTIPLE_CHOICE).sortOrder(0).build());
    admin(get(base()), null).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.questions[0].authoringSupported").value(false));
    publication(id, true).andExpect(status().isConflict());
    admin(put(path(id) + "/questions/" + legacy.getId()), validQuestion()).andExpect(status().isConflict());
    admin(delete(path(id) + "/questions/" + legacy.getId()), null).andExpect(status().isConflict());
    admin(put(path(id) + "/questions/order"), "{\"questionIds\":[" + legacy.getId() + "]}")
        .andExpect(status().isConflict());
    assertThat(questions.findById(legacy.getId()).orElseThrow().getDeletedAt()).isNull();
    admin(delete(path(id)), null).andExpect(status().isNoContent());
    assertThat(questions.findById(legacy.getId()).orElseThrow().getDeletedAt()).isNull();
  }

  @Test
  void studentCanRetrieveAndAnswerNewQuizWithoutInitialAnswerLeakage() throws Exception {
    long id = createQuiz();
    long questionId = addQuestion(id);
    long correct = options.findByQuestionIdOrderBySortOrderAsc(questionId).get(0).getId();
    String study = "/api/v1/study/lessons/" + lesson.getId() + "/quiz";
    String answer = study + "/" + id + "/questions/" + questionId + "/answer";
    publication(id, true).andExpect(status().isOk());
    mvc.perform(get(study).with(student())).andExpect(status().isBadRequest());
    lesson.setIsPublished(true);
    lessons.saveAndFlush(lesson);
    mvc.perform(get(study).with(student())).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.questions[0].options[0].isCorrect").doesNotExist())
        .andExpect(jsonPath("$..correctOptionId").isEmpty()).andExpect(jsonPath("$..isCorrect").isEmpty());
    mvc.perform(post(answer).param("optionId", Long.toString(correct))).andExpect(status().isUnauthorized());
    mvc.perform(post(answer).with(student()).param("optionId", Long.toString(correct)))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.correct").value(true))
        .andExpect(jsonPath("$.data.correctOptionId").value(correct));
    long incorrect = options.findByQuestionIdOrderBySortOrderAsc(questionId).get(1).getId();
    mvc.perform(post(answer).with(student()).param("optionId", Long.toString(incorrect)))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.correct").value(false));
    publication(id, false).andExpect(status().isOk());
    mvc.perform(get(study).with(student())).andExpect(status().isNotFound());
    mvc.perform(post(answer).with(student()).param("optionId", Long.toString(correct)))
        .andExpect(status().isNotFound());
    publication(id, true).andExpect(status().isOk());
    admin(delete(path(id)), null).andExpect(status().isNoContent());
    mvc.perform(get(study).with(student())).andExpect(status().isNotFound());
    mvc.perform(post(answer).with(student()).param("optionId", Long.toString(correct)))
        .andExpect(status().isNotFound());
  }

  @Test
  void savedDraftPreviewAndQuizAuthoringPreserveOtherLessonContent() throws Exception {
    String lessonPath = "/api/v1/lessons/" + lesson.getId();
    admin(patch(lessonPath + "/grammar"), "{\"grammar\":\"<p>Saved grammar</p>\"}")
        .andExpect(status().isOk());
    String vocabularyBody = "{\"lessonId\":%s,\"word\":\"coffee\",\"reading\":\"coffee\","
        + "\"meaningVi\":\"coffee\",\"partOfSpeech\":\"noun\"}";
    long vocabularyId = data(admin(post("/api/v1/vocabularies"), vocabularyBody.formatted(lesson.getId()))
        .andExpect(status().isCreated())).get("id").asLong();
    String kanjiBody = "{\"lessonId\":%s,\"kanji\":\"統合試験六\",\"meaningVi\":\"integration\",\"strokeCount\":null}";
    long kanjiId = data(admin(post("/api/v1/kanjis"), kanjiBody.formatted(lesson.getId()))
        .andExpect(status().isCreated())).get("id").asLong();
    long quizId = createQuiz();
    long first = addQuestion(quizId);
    long second = addQuestion(quizId);
    var firstOptions = options.findByQuestionIdOrderBySortOrderAsc(first);
    admin(put(path(quizId) + "/questions/" + first),
        questionBody(firstOptions.get(0).getId(), firstOptions.get(1).getId(), false, true))
        .andExpect(status().isOk());
    admin(put(path(quizId) + "/questions/order"), "{\"questionIds\":[" + second + "," + first + "]}")
        .andExpect(status().isOk());

    // The preview's real admin read contract: drafts, no enrollment/progress/attempt side effects.
    Long progressBefore = jdbc.queryForObject("select count(*) from user_lesson_progress", Long.class);
    Long enrollmentsBefore = jdbc.queryForObject("select count(*) from user_course_enrollments", Long.class);
    Long attemptsBefore = jdbc.queryForObject("select count(*) from user_jlpt_attempts", Long.class);
    admin(get(lessonPath), null).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.grammar").value("<p>Saved grammar</p>"))
        .andExpect(jsonPath("$.data.isPublished").value(false));
    admin(get("/api/v1/vocabularies").param("lessonId", lesson.getId().toString()), null)
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.content[0].id").value(vocabularyId));
    admin(get("/api/v1/kanjis").param("lessonId", lesson.getId().toString()), null)
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.content[0].id").value(kanjiId))
        .andExpect(jsonPath("$.data.content[0].strokeCount").isEmpty());
    admin(get(base()), null).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.isPublished").value(false))
        .andExpect(jsonPath("$.data.questions[0].id").value(second))
        .andExpect(jsonPath("$.data.questions[1].options[1].isCorrect").value(true));
    assertThat(jdbc.queryForObject("select count(*) from user_lesson_progress", Long.class))
        .isEqualTo(progressBefore);
    assertThat(jdbc.queryForObject("select count(*) from user_course_enrollments", Long.class))
        .isEqualTo(enrollmentsBefore);
    assertThat(jdbc.queryForObject("select count(*) from user_jlpt_attempts", Long.class))
        .isEqualTo(attemptsBefore);

    publication(quizId, true).andExpect(status().isOk());
    admin(patch(lessonPath + "/publication"), "{\"isPublished\":true}").andExpect(status().isOk());
    String study = "/api/v1/study/lessons/" + lesson.getId();
    mvc.perform(get(study + "/quiz").with(student())).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.questions[0].id").value(second))
        .andExpect(jsonPath("$..isCorrect").isEmpty()).andExpect(jsonPath("$..correctOptionId").isEmpty());
    mvc.perform(post(study + "/quiz/" + quizId + "/questions/" + first + "/answer").with(student())
        .param("optionId", firstOptions.get(1).getId().toString()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.correct").value(true));
    publication(quizId, false).andExpect(status().isOk());
    mvc.perform(get(study + "/quiz").with(student())).andExpect(status().isNotFound());
    admin(delete(path(quizId)), null).andExpect(status().isNoContent());
    admin(get(lessonPath), null).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.grammar").value("<p>Saved grammar</p>"))
        .andExpect(jsonPath("$.data.isPublished").value(true));
    admin(get("/api/v1/vocabularies/" + vocabularyId), null).andExpect(status().isOk());
    admin(get("/api/v1/kanjis/" + kanjiId), null).andExpect(status().isOk());
  }

  @Test
  void removedOptionsAndDeletedQuestionsCannotBeAnswered() throws Exception {
    long id = createQuiz();
    long questionId = addQuestion(id);
    long second = addQuestion(id);
    long removed = options.findByQuestionIdOrderBySortOrderAsc(questionId).get(0).getId();
    admin(put(path(id) + "/questions/" + questionId), validQuestion()).andExpect(status().isOk());
    publication(id, true).andExpect(status().isOk());
    lesson.setIsPublished(true);
    lessons.saveAndFlush(lesson);
    String answer = "/api/v1/study/lessons/" + lesson.getId() + "/quiz/" + id
        + "/questions/" + questionId + "/answer";
    mvc.perform(post(answer).with(student()).param("optionId", Long.toString(removed)))
        .andExpect(status().isNotFound());
    long foreign = options.findByQuestionIdOrderBySortOrderAsc(second).get(0).getId();
    mvc.perform(post(answer).with(student()).param("optionId", Long.toString(foreign)))
        .andExpect(status().isBadRequest());
    long retained = options.findByQuestionIdOrderBySortOrderAsc(questionId).get(0).getId();
    admin(delete(path(id) + "/questions/" + questionId), null).andExpect(status().isNoContent());
    mvc.perform(post(answer).with(student()).param("optionId", Long.toString(retained)))
        .andExpect(status().isNotFound());
  }

  @Test
  void duplicateLegacyQuizzesReturnConflictWithoutChoosingOrDeleting() throws Exception {
    long id = createQuiz();
    quizzes.saveAndFlush(Quiz.builder().lesson(lesson).title("Duplicate").description("").build());
    admin(get(base()), null).andExpect(status().isConflict());
    admin(post(base()), METADATA).andExpect(status().isConflict());
    admin(delete(path(id)), null).andExpect(status().isConflict());
    lesson.setIsPublished(true);
    lessons.saveAndFlush(lesson);
    mvc.perform(get("/api/v1/study/lessons/" + lesson.getId() + "/quiz").with(student()))
        .andExpect(status().isConflict());
    assertThat(quizzes.findByLessonIdAndDeletedAtIsNull(lesson.getId())).hasSize(2);
  }

  @Test
  void referencedOptionsCannotBeRemovedEvenWithSetNullForeignKey() throws Exception {
    long id = createQuiz();
    long questionId = addQuestion(id);
    long optionId = options.findByQuestionIdOrderBySortOrderAsc(questionId).get(0).getId();
    jdbc.execute("create table phase5_option_references (id bigint primary key, option_id bigint, "
        + "foreign key (option_id) references quiz_options(id) on delete set null)");
    try {
      jdbc.update("insert into phase5_option_references (id, option_id) values (1, ?)", optionId);
      admin(put(path(id) + "/questions/" + questionId), validQuestion()).andExpect(status().isConflict());
      assertThat(jdbc.queryForObject("select option_id from phase5_option_references where id = 1", Long.class))
          .isEqualTo(optionId);
      assertThat(options.findById(optionId)).isPresent();
    } finally {
      jdbc.execute("drop table phase5_option_references");
    }
  }

  @Test
  void concurrentCreationWaitsForStableParentLockAndCreatesOnlyOneQuiz()
      throws InterruptedException, ExecutionException, TimeoutException {
    var executor = Executors.newFixedThreadPool(3);
    CountDownLatch locked = new CountDownLatch(1);
    CountDownLatch release = new CountDownLatch(1);
    CountDownLatch started = new CountDownLatch(2);
    Long lessonId = lesson.getId();
    String endpoint = base();
    try {
      var holder = executor.submit(() -> new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
        lessons.findActiveForUpdate(lessonId).orElseThrow();
        locked.countDown();
        await(release);
      }));
      assertThat(locked.await(5, TimeUnit.SECONDS)).isTrue();
      var first = executor.submit(() -> {
        started.countDown();
        return admin(post(endpoint), METADATA).andReturn().getResponse().getStatus();
      });
      var second = executor.submit(() -> {
        started.countDown();
        return admin(post(endpoint), METADATA).andReturn().getResponse().getStatus();
      });
      assertThat(started.await(5, TimeUnit.SECONDS)).isTrue();
      // Both HTTP transactions must remain blocked while the parent is locked.
      org.junit.jupiter.api.Assertions.assertThrows(java.util.concurrent.TimeoutException.class,
          () -> first.get(200, TimeUnit.MILLISECONDS));
      assertThat(second.isDone()).isFalse();
      release.countDown();
      holder.get(10, TimeUnit.SECONDS);
      assertThat(List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS)))
          .containsExactlyInAnyOrder(201, 409);
      assertThat(quizzes.findByLessonIdAndDeletedAtIsNull(lessonId)).hasSize(1);
    } finally {
      release.countDown();
      executor.shutdownNow();
    }
  }

  @Test
  void concurrentQuestionDeletionCannotEmptyPublishedQuiz() throws Exception {
    long id = createQuiz();
    long firstId = addQuestion(id);
    long secondId = addQuestion(id);
    publication(id, true).andExpect(status().isOk());
    var executor = Executors.newFixedThreadPool(2);
    CountDownLatch start = new CountDownLatch(1);
    String endpoint = path(id) + "/questions/";
    try {
      var first = executor.submit(() -> {
        await(start);
        return admin(delete(endpoint + firstId), null).andReturn().getResponse().getStatus();
      });
      var second = executor.submit(() -> {
        await(start);
        return admin(delete(endpoint + secondId), null).andReturn().getResponse().getStatus();
      });
      start.countDown();
      assertThat(List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS)))
          .containsExactlyInAnyOrder(204, 409);
      assertThat(questions.findByQuizIdAndDeletedAtIsNullOrderBySortOrderAscIdAsc(id)).hasSize(1);
    } finally {
      executor.shutdownNow();
    }
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

  private String base() {
    return "/api/v1/admin/lessons/" + lesson.getId() + "/quiz";
  }

  private String path(long quizId) {
    return base() + "/" + quizId;
  }

  private ResultActions admin(MockHttpServletRequestBuilder request, String body) throws Exception {
    request.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")));
    if (body != null) {
      request.contentType(MediaType.APPLICATION_JSON).content(body);
    }
    return mvc.perform(request);
  }

  private RequestPostProcessor student() {
    return jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"));
  }

  private long createQuiz() throws Exception {
    return data(admin(post(base()), METADATA).andExpect(status().isCreated())).get("id").asLong();
  }

  private long addQuestion(long quizId) throws Exception {
    JsonNode result = data(admin(post(path(quizId) + "/questions"), validQuestion()).andExpect(status().isCreated()));
    JsonNode items = result.get("questions");
    return items.get(items.size() - 1).get("id").asLong();
  }

  private ResultActions publication(long quizId, boolean published) throws Exception {
    return admin(patch(path(quizId) + "/publication"), "{\"isPublished\":" + published + "}");
  }

  private JsonNode data(ResultActions result) throws UnsupportedEncodingException {
    return JSON.readTree(result.andReturn().getResponse().getContentAsString()).get("data");
  }

  private String validQuestion() {
    return questionBody(null, null, true, false);
  }

  private String questionBody(Long firstId, Long secondId, boolean firstCorrect, boolean secondCorrect) {
    return ("{\"questionText\":\"  Question  \",\"questionType\":\"SINGLE_CHOICE\",\"options\":["
        + "{\"id\":%s,\"optionText\":\"  First  \",\"isCorrect\":%s},"
        + "{\"id\":%s,\"optionText\":\"Second\",\"isCorrect\":%s}]}")
        .formatted(firstId, firstCorrect, secondId, secondCorrect);
  }
}
