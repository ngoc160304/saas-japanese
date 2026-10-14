package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseEnrollment;
import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.LessonProgress;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.Quiz;
import com.mycompany.saas_japanese.domain.QuizOption;
import com.mycompany.saas_japanese.domain.QuizQuestion;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.repository.CourseEnrollmentRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.KanjiRepository;
import com.mycompany.saas_japanese.repository.LessonProgressRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.QuizOptionRepository;
import com.mycompany.saas_japanese.repository.QuizQuestionRepository;
import com.mycompany.saas_japanese.repository.QuizRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.repository.VocabularyRepository;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.constant.QuizQuestionTypeEnum;
import com.mycompany.saas_japanese.util.constant.UserRoleEnum;

// No enclosing transaction: HTTP requests and competing writers use real, independent transactions.
class StudentLearningIntegrationTest extends AuthTestSupport {
    @Autowired private WebApplicationContext context;
    @Autowired private CourseRepository courses;
    @Autowired private LessonRepository lessons;
    @Autowired private UserRepository users;
    @Autowired private CourseEnrollmentRepository enrollments;
    @Autowired private LessonProgressRepository progress;
    @Autowired private MediaRepository media;
    @Autowired private QuizRepository quizzes;
    @Autowired private QuizQuestionRepository questions;
    @Autowired private QuizOptionRepository options;
    @Autowired private VocabularyRepository vocabularies;
    @Autowired private KanjiRepository kanjis;
    @Autowired private JdbcTemplate jdbc;
    private MockMvc mvc;
    private Course course;
    private Lesson lesson;
    private User student;
    private User outsider;
    private CourseEnrollment enrollment;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        course = courses.save(Course.builder().title("Learning").slug(UUID.randomUUID().toString())
                .isPublished(true).price(BigDecimal.ZERO).build());
        lesson = lesson(course, true, false, true);
        student = user();
        outsider = user();
        enrollment = enrollments.save(CourseEnrollment.builder().course(course).user(student).build());
    }

    @AfterEach
    void removeStudentFixtures() {
        jdbc.update("delete from user_lesson_progress where user_id in (?, ?)", student.getId(), outsider.getId());
        jdbc.update("delete from user_course_enrollments where user_id in (?, ?)", student.getId(), outsider.getId());
        users.deleteAllById(List.of(student.getId(), outsider.getId()));
    }

    @Test
    void enrolledStudentListsStableLightweightSummariesAndOpensRealContent() throws Exception {
        Lesson second = lesson(course, true, false, false);
        lesson(course, false, false, false);
        lesson(course, true, true, false);
        saveProgress(student, lesson, true);
        mvc.perform(get(coursePath() + "/lessons").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(lesson.getId()))
                .andExpect(jsonPath("$.data[1].id").value(second.getId()))
                .andExpect(jsonPath("$.data[0].courseId").value(course.getId()))
                .andExpect(jsonPath("$.data[0].title").value(lesson.getTitle()))
                .andExpect(jsonPath("$.data[0].durationMinutes").value(10))
                .andExpect(jsonPath("$.data[0].isCompleted").value(true))
                .andExpect(jsonPath("$.data[0].watchDuration").value(100))
                .andExpect(jsonPath("$.data[1].progressPercent").value(0))
                .andExpect(jsonPath("$.data[1].isCompleted").value(false))
                .andExpect(jsonPath("$..grammar").isEmpty()).andExpect(jsonPath("$..videoUrl").isEmpty())
                .andExpect(jsonPath("$..videoMediaId").isEmpty()).andExpect(jsonPath("$..isDeleted").isEmpty());
        mvc.perform(get(lessonPath()).with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(lesson.getId()))
                .andExpect(jsonPath("$.data.courseId").value(course.getId()))
                .andExpect(jsonPath("$.data.slug").value(lesson.getSlug()))
                .andExpect(jsonPath("$.data.grammar").value("<p>Published grammar</p>"))
                .andExpect(jsonPath("$.data.videoUrl").value(lesson.getVideoMedia().getSecureUrl()))
                .andExpect(jsonPath("$.data.durationMinutes").value(10))
                .andExpect(jsonPath("$.data.createdAt").doesNotExist())
                .andExpect(jsonPath("$.data.isPublished").doesNotExist());
    }

    @Test
    void everyStudyEndpointRequiresAuthenticationAndEnrollment() throws Exception {
        QuizData quiz = quiz(lesson);
        List<MockHttpServletRequestBuilder> requests = allRequests(quiz);
        for (MockHttpServletRequestBuilder request : requests) {
            mvc.perform(request).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.status").value(401));
        }
        for (MockHttpServletRequestBuilder request : allRequests(quiz)) {
            mvc.perform(request.with(as(outsider))).andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }
        assertThat(progress.findByUserIdAndLessonId(outsider.getId(), lesson.getId())).isEmpty();
    }

    @Test
    void missingOrInactiveAuthenticatedUserCannotStudy() throws Exception {
        mvc.perform(get(lessonPath()).with(jwt().jwt(token -> token.subject("missing@example.test"))))
                .andExpect(status().isUnauthorized());
        student.setActive(false);
        users.saveAndFlush(student);
        mvc.perform(get(lessonPath()).with(as(student))).andExpect(status().isUnauthorized());
    }

    @Test
    void adminContentReadsCannotBypassEnrollmentAndStorefrontRemainsPublic() throws Exception {
        for (String path : List.of("/api/v1/lessons", "/api/v1/lessons/" + lesson.getId(),
                "/api/v1/vocabularies", "/api/v1/vocabularies/999999999",
                "/api/v1/kanjis", "/api/v1/kanjis/999999999")) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(get(path).with(as(outsider))).andExpect(status().isForbidden());
            mvc.perform(get(path).with(as(student))).andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/v1/lessons/" + lesson.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.grammar").exists());
        mvc.perform(get("/api/v1/client/courses/" + course.getId() + "/lessons"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].id").value(lesson.getId()))
                .andExpect(jsonPath("$..grammar").isEmpty()).andExpect(jsonPath("$..videoUrl").isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"lesson-draft", "lesson-deleted", "lesson-deleted-at",
        "course-draft", "course-deleted", "course-deleted-at"})
    void unavailableParentsAreHiddenAcrossEveryEndpoint(String state) throws Exception {
        QuizData quiz = quiz(lesson);
        switch (state) {
            case "lesson-draft" -> lesson.setIsPublished(false);
            case "lesson-deleted" -> lesson.setIsDeleted(true);
            case "lesson-deleted-at" -> lesson.setDeletedAt(Instant.now());
            case "course-draft" -> course.setIsPublished(false);
            case "course-deleted" -> course.setIsDeleted(true);
            case "course-deleted-at" -> course.setDeletedAt(Instant.now());
            default -> throw new IllegalArgumentException(state);
        }
        lessons.saveAndFlush(lesson);
        courses.saveAndFlush(course);
        for (MockHttpServletRequestBuilder request : lessonRequests(quiz)) {
            mvc.perform(request.with(as(student))).andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
        for (String suffix : List.of("/lessons", "/progress")) {
            mvc.perform(get(coursePath() + suffix).with(as(student)))
                    .andExpect(status().is(state.startsWith("course") ? 404 : 200));
        }
    }

    @Test
    void nonexistentResourcesReturn404AndMalformedIdsReturn400() throws Exception {
        for (String suffix : List.of("", "/vocabularies", "/kanjis", "/quiz", "/progress")) {
            mvc.perform(get("/api/v1/study/lessons/999999999" + suffix).with(as(student)))
                    .andExpect(status().isNotFound());
        }
        for (String suffix : List.of("/lessons", "/progress")) {
            mvc.perform(get("/api/v1/study/courses/999999999" + suffix).with(as(student)))
                    .andExpect(status().isNotFound());
        }
        mvc.perform(get("/api/v1/study/lessons/invalid").with(as(student))).andExpect(status().isBadRequest());
    }

    @Test
    void optionalContentIsEmptyAndOpeningNeverStartsProgress() throws Exception {
        lesson.setVideoMedia(null);
        lesson.setGrammar(" ");
        lesson.setDurationMinutes(null);
        lessons.saveAndFlush(lesson);
        mvc.perform(get(lessonPath()).with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.videoUrl").isEmpty()).andExpect(jsonPath("$.data.grammar").isEmpty())
                .andExpect(jsonPath("$.data.durationMinutes").isEmpty());
        for (String suffix : List.of("/vocabularies", "/kanjis")) {
            mvc.perform(get(lessonPath() + suffix).with(as(student))).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
        mvc.perform(get(lessonPath() + "/quiz").with(as(student))).andExpect(status().isNoContent())
                .andExpect(content().string(""));
        mvc.perform(get(lessonPath() + "/progress").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.watchDuration").value(0))
                .andExpect(jsonPath("$.data.videoDuration").value(0))
                .andExpect(jsonPath("$.data.isCompleted").value(false))
                .andExpect(jsonPath("$.data.lastWatchedAt").isEmpty());
        update(lesson, 100, 100).andExpect(status().isBadRequest());
        assertThat(progress.findByUserIdAndLessonId(student.getId(), lesson.getId())).isEmpty();
        assertThat(enrollments.findById(enrollment.getId()).orElseThrow().getCompletedAt()).isNull();
    }

    @Test
    void deletedMediaIsAbsentAndCannotBeUsedForProgress() throws Exception {
        Media video = lesson.getVideoMedia();
        video.setIsDeleted(true);
        media.saveAndFlush(video);
        mvc.perform(get(lessonPath()).with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.videoUrl").isEmpty());
        update(lesson, 80, 100).andExpect(status().isBadRequest());
    }

    @Test
    void vocabularyAndKanjiOnlyReturnActiveContentForThisLesson() throws Exception {
        Vocabulary word = vocabularies.save(Vocabulary.builder().lesson(lesson).word("word").reading("reading")
                .meaningVi("meaning").exampleSentenceJp("example").build());
        vocabularies.save(Vocabulary.builder().lesson(lesson).word("deleted").reading("reading")
                .meaningVi("meaning").deletedAt(Instant.now()).build());
        String symbol = UUID.randomUUID().toString().substring(0, 8);
        Kanji kanji = kanjis.save(Kanji.builder().lesson(lesson).kanji(symbol).meaningVi("meaning").build());
        kanjis.save(Kanji.builder().lesson(lesson).kanji(symbol + "x").meaningVi("meaning")
                .deletedAt(Instant.now()).build());
        mvc.perform(get(lessonPath() + "/vocabularies").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(word.getId()))
                .andExpect(jsonPath("$.data[0].exampleSentenceJp").value("example"));
        mvc.perform(get(lessonPath() + "/kanjis").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(kanji.getId()));
    }

    @Test
    void quizLifecycleDistinguishesAbsentQuizAndNeverLeaksInitialAnswers() throws Exception {
        QuizData quiz = quiz(lesson);
        mvc.perform(get(lessonPath() + "/quiz").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(quiz.quiz().getId()))
                .andExpect(jsonPath("$.data.questions[0].id").value(quiz.question().getId()))
                .andExpect(jsonPath("$.data.questions[0].options.length()").value(2))
                .andExpect(jsonPath("$..correctOptionId").isEmpty()).andExpect(jsonPath("$..isCorrect").isEmpty());
        answer(quiz, quiz.quiz().getId(), quiz.question().getId(), quiz.correct().getId())
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.correct").value(true));
        answer(quiz, quiz.quiz().getId(), quiz.question().getId(), quiz.wrong().getId())
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.correct").value(false));
        quiz.quiz().setIsPublished(false);
        quizzes.saveAndFlush(quiz.quiz());
        mvc.perform(get(lessonPath() + "/quiz").with(as(student))).andExpect(status().isNoContent());
        answer(quiz, quiz.quiz().getId(), quiz.question().getId(), quiz.correct().getId())
                .andExpect(status().isNotFound());
        quiz.quiz().setIsPublished(true);
        quiz.quiz().setDeletedAt(Instant.now());
        quizzes.saveAndFlush(quiz.quiz());
        mvc.perform(get(lessonPath() + "/quiz").with(as(student))).andExpect(status().isNoContent());
        answer(quiz, quiz.quiz().getId(), quiz.question().getId(), quiz.correct().getId())
                .andExpect(status().isNotFound());
    }

    @Test
    void quizAnswerValidatesEveryParentAndRejectsDeletedQuestionsAndMissingOptions() throws Exception {
        QuizData own = quiz(lesson);
        QuizData foreign = quiz(lesson(course, true, false, false));
        answer(own, foreign.quiz().getId(), foreign.question().getId(), foreign.correct().getId())
                .andExpect(status().isNotFound());
        answer(own, own.quiz().getId(), foreign.question().getId(), foreign.correct().getId())
                .andExpect(status().isBadRequest());
        answer(own, own.quiz().getId(), own.question().getId(), foreign.correct().getId())
                .andExpect(status().isBadRequest());
        answer(own, own.quiz().getId(), own.question().getId(), 999999999L).andExpect(status().isNotFound());
        mvc.perform(post(answerPath(own, own.quiz().getId(), own.question().getId())).with(as(student)))
                .andExpect(status().isBadRequest());
        own.question().setDeletedAt(Instant.now());
        questions.saveAndFlush(own.question());
        answer(own, own.quiz().getId(), own.question().getId(), own.correct().getId())
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"watchDuration\":-1,\"videoDuration\":100}",
        "{\"watchDuration\":0,\"videoDuration\":0}", "{\"watchDuration\":1,\"videoDuration\":-1}",
        "{\"watchDuration\":null,\"videoDuration\":100}", "{\"watchDuration\":1}", "not-json"})
    void invalidProgressDoesNotCreateRows(String body) throws Exception {
        mvc.perform(post(lessonPath() + "/progress").with(as(student)).contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        assertThat(progress.findByUserIdAndLessonId(student.getId(), lesson.getId())).isEmpty();
    }

    @Test
    void progressUsesAuthenticatedOwnerAndIgnoresClientOwnershipSelection() throws Exception {
        enrollments.save(CourseEnrollment.builder().course(course).user(outsider).build());
        mvc.perform(post(lessonPath() + "/progress").with(as(student)).param("userId", outsider.getId().toString())
                .contentType(MediaType.APPLICATION_JSON).content(progressBody(80, 100))).andExpect(status().isOk());
        assertThat(progress.findByUserIdAndLessonId(student.getId(), lesson.getId())).isPresent();
        assertThat(progress.findByUserIdAndLessonId(outsider.getId(), lesson.getId())).isEmpty();
        mvc.perform(get(lessonPath() + "/progress").with(as(outsider)).param("userId", student.getId().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.progressPercent").value(0));
        mvc.perform(get(coursePath() + "/lessons").with(as(outsider))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].isCompleted").value(false));
        mvc.perform(get(coursePath() + "/progress").with(as(outsider))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completedLessons").value(0));
    }

    @Test
    void repeatedProgressRespectsExactCompletionBoundaryClampsAndPreservesTimestamps() throws Exception {
        update(lesson, 0, 100).andExpect(status().isOk()).andExpect(jsonPath("$.data.isCompleted").value(false));
        update(lesson, 79, 100).andExpect(status().isOk()).andExpect(jsonPath("$.data.isCompleted").value(false));
        update(lesson, 80, 100).andExpect(status().isOk()).andExpect(jsonPath("$.data.isCompleted").value(true))
                .andExpect(jsonPath("$.data.courseProgressPercent").value(100));
        Instant completedAt = progress.findByUserIdAndLessonId(student.getId(), lesson.getId())
                .orElseThrow().getCompletedAt();
        Instant courseCompletedAt = enrollments.findById(enrollment.getId()).orElseThrow().getCompletedAt();
        update(lesson, 10, 100).andExpect(status().isOk()).andExpect(jsonPath("$.data.watchDuration").value(80));
        update(lesson, 200, 100).andExpect(status().isOk()).andExpect(jsonPath("$.data.watchDuration").value(100))
                .andExpect(jsonPath("$.data.progressPercent").value(100));
        assertThat(progress.findByUserIdAndLessonId(student.getId(), lesson.getId()).orElseThrow().getCompletedAt())
                .isEqualTo(completedAt);
        assertThat(enrollments.findById(enrollment.getId()).orElseThrow().getCompletedAt())
                .isEqualTo(courseCompletedAt);
        assertThat(progress.findByUserIdAndLessonCourseId(student.getId(), course.getId())).hasSize(1);
        // Display rounding to 80.00 must not complete a lesson still just below the actual threshold.
        Lesson boundary = lesson(course, true, false, true);
        update(boundary, 15999, 20000).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progressPercent").value(80))
                .andExpect(jsonPath("$.data.isCompleted").value(false));
        update(boundary, 16000, 20000).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isCompleted").value(true));
    }

    @Test
    void courseProgressUsesTheSameAvailableLessonSetForReadsAndWrites() throws Exception {
        Lesson second = lesson(course, true, false, true);
        Lesson draft = lesson(course, false, false, true);
        Lesson deleted = lesson(course, true, true, true);
        saveProgress(student, draft, true);
        saveProgress(student, deleted, true);
        saveProgress(outsider, second, true);
        update(lesson, 80, 100).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.courseProgressPercent").value(50));
        mvc.perform(get(coursePath() + "/progress").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalLessons").value(2))
                .andExpect(jsonPath("$.data.completedLessons").value(1))
                .andExpect(jsonPath("$.data.progressPercent").value(50));
        update(second, 80, 100).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.courseProgressPercent").value(100));
        assertThat(enrollments.findById(enrollment.getId()).orElseThrow().getProgressPercent())
                .isEqualByComparingTo("100");
        second.setIsPublished(false);
        lessons.saveAndFlush(second);
        mvc.perform(get(coursePath() + "/progress").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalLessons").value(1))
                .andExpect(jsonPath("$.data.completedLessons").value(1))
                .andExpect(jsonPath("$.data.progressPercent").value(100));
        lesson.setIsPublished(false);
        lessons.saveAndFlush(lesson);
        mvc.perform(get(coursePath() + "/progress").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalLessons").value(0))
                .andExpect(jsonPath("$.data.completedLessons").value(0))
                .andExpect(jsonPath("$.data.progressPercent").value(0));
        mvc.perform(get(coursePath() + "/lessons").with(as(student))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void everyGetLeavesProgressAndEnrollmentCompletelyUnchanged(boolean existingProgress) throws Exception {
        QuizData quiz = quiz(lesson);
        if (existingProgress) {
            saveProgress(student, lesson, true);
        }
        List<Map<String, Object>> progressBefore = progressRows();
        Map<String, Object> enrollmentBefore = enrollmentRow();
        // Stored enrollment is intentionally stale (0%, no completion timestamp); GET must only derive results.
        for (MockHttpServletRequestBuilder request : allRequests(quiz)) {
            if (request.buildRequest(context.getServletContext()).getMethod().equals("GET")) {
                mvc.perform(request.with(as(student))).andExpect(status().isOk());
            }
        }
        assertThat(progressRows()).isEqualTo(progressBefore);
        assertThat(enrollmentRow()).isEqualTo(enrollmentBefore);
    }

    @Test
    void concurrentFirstUpdatesCreateOneRowAndKeepTheGreatestWatchedTime()
            throws InterruptedException, ExecutionException, TimeoutException {
        concurrently(() -> update(lesson, 79, 100).andReturn().getResponse().getStatus(),
                () -> update(lesson, 80, 100).andReturn().getResponse().getStatus());
        assertThat(progressRows()).hasSize(1);
        LessonProgress result = progress.findByUserIdAndLessonId(student.getId(), lesson.getId()).orElseThrow();
        assertThat(result.getWatchDuration()).isEqualTo(80);
        assertThat(result.getIsCompleted()).isTrue();
        assertThat(enrollments.findById(enrollment.getId()).orElseThrow().getProgressPercent())
                .isEqualByComparingTo("100");
    }

    @Test
    void concurrentUpdatesToDifferentLessonsDoNotLoseCourseProgress()
            throws InterruptedException, ExecutionException, TimeoutException {
        Lesson second = lesson(course, true, false, true);
        concurrently(() -> update(lesson, 80, 100).andReturn().getResponse().getStatus(),
                () -> update(second, 80, 100).andReturn().getResponse().getStatus());
        assertThat(progressRows()).hasSize(2);
        CourseEnrollment result = enrollments.findById(enrollment.getId()).orElseThrow();
        assertThat(result.getProgressPercent()).isEqualByComparingTo("100");
        assertThat(result.getCompletedAt()).isNotNull();
    }

    private void concurrently(Callable<Integer> first, Callable<Integer> second)
            throws InterruptedException, ExecutionException, TimeoutException {
        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<java.util.concurrent.Future<Integer>> futures = new ArrayList<>();
            for (Callable<Integer> action : List.of(first, second)) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    assertThat(start.await(10, TimeUnit.SECONDS)).isTrue();
                    return action.call();
                }));
            }
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            for (var future : futures) {
                assertThat(future.get(30, TimeUnit.SECONDS)).isEqualTo(200);
            }
        } finally {
            start.countDown();
            executor.shutdownNow();
            assertThat(executor.awaitTermination(10, TimeUnit.SECONDS)).isTrue();
        }
    }

    private List<Map<String, Object>> progressRows() {
        return jdbc.queryForList("select * from user_lesson_progress where user_id = ? order by id", student.getId());
    }

    private Map<String, Object> enrollmentRow() {
        return jdbc.queryForMap("select * from user_course_enrollments where id = ?", enrollment.getId());
    }

    private List<MockHttpServletRequestBuilder> allRequests(QuizData quiz) {
        List<MockHttpServletRequestBuilder> requests = new ArrayList<>(lessonRequests(quiz));
        requests.add(get(coursePath() + "/lessons"));
        requests.add(get(coursePath() + "/progress"));
        return requests;
    }

    private List<MockHttpServletRequestBuilder> lessonRequests(QuizData quiz) {
        List<MockHttpServletRequestBuilder> requests = new ArrayList<>();
        for (String suffix : List.of("", "/vocabularies", "/kanjis", "/quiz", "/progress")) {
            requests.add(get(lessonPath() + suffix));
        }
        requests.add(post(lessonPath() + "/progress").contentType(MediaType.APPLICATION_JSON)
                .content(progressBody(80, 100)));
        requests.add(post(answerPath(quiz, quiz.quiz().getId(), quiz.question().getId()))
                .param("optionId", quiz.correct().getId().toString()));
        return requests;
    }

    private ResultActions update(Lesson target, int watched, int duration) throws Exception {
        return mvc.perform(post("/api/v1/study/lessons/" + target.getId() + "/progress").with(as(student))
                .contentType(MediaType.APPLICATION_JSON).content(progressBody(watched, duration)));
    }

    private String progressBody(int watched, int duration) {
        return "{\"watchDuration\":" + watched + ",\"videoDuration\":" + duration + "}";
    }

    private ResultActions answer(QuizData quiz, Long quizId, Long questionId, Long optionId) throws Exception {
        return mvc.perform(post(answerPath(quiz, quizId, questionId)).with(as(student))
                .param("optionId", optionId.toString()));
    }

    private String answerPath(QuizData quiz, Long quizId, Long questionId) {
        return "/api/v1/study/lessons/" + quiz.quiz().getLesson().getId() + "/quiz/" + quizId
                + "/questions/" + questionId + "/answer";
    }

    private String lessonPath() {
        return "/api/v1/study/lessons/" + lesson.getId();
    }

    private String coursePath() {
        return "/api/v1/study/courses/" + course.getId();
    }

    private RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(user.getEmail()))
                .authorities(new SimpleGrantedAuthority("ROLE_STUDENT"));
    }

    private User user() {
        User user = new User();
        user.setEmail(UUID.randomUUID() + "@example.test");
        user.setRole(UserRoleEnum.student);
        user.setActive(true);
        user.setVerified(true);
        return users.save(user);
    }

    private Lesson lesson(Course parent, boolean published, boolean deleted, boolean withVideo) {
        String slug = UUID.randomUUID().toString();
        Media video = withVideo ? media.save(Media.builder().fileName(slug).publicId(slug)
                .secureUrl("https://example.test/" + slug + ".mp4").fileType(FileTypeEnum.VIDEO).build()) : null;
        return lessons.save(Lesson.builder().course(parent).title("Lesson " + slug).slug(slug)
                .grammar("<p>Published grammar</p>").durationMinutes(10).isPublished(published)
                .isDeleted(deleted).deletedAt(deleted ? Instant.now() : null).videoMedia(video).build());
    }

    private void saveProgress(User owner, Lesson target, boolean complete) {
        progress.saveAndFlush(LessonProgress.builder().user(owner).lesson(target).watchDuration(complete ? 100 : 25)
                .videoDuration(100).progressPercent(BigDecimal.valueOf(complete ? 100 : 25)).isCompleted(complete)
                .completedAt(complete ? Instant.now() : null).lastWatchedAt(Instant.now()).build());
    }

    private QuizData quiz(Lesson target) {
        Quiz quiz = quizzes.save(Quiz.builder().lesson(target).title("Practice").description("")
                .isPublished(true).build());
        QuizQuestion question = questions.save(QuizQuestion.builder().quiz(quiz).questionText("Choose one")
                .questionType(QuizQuestionTypeEnum.SINGLE_CHOICE).sortOrder(0).build());
        QuizOption correct = options.save(QuizOption.builder().question(question).optionText("First")
                .isCorrect(true).sortOrder(0).build());
        QuizOption wrong = options.save(QuizOption.builder().question(question).optionText("Second")
                .isCorrect(false).sortOrder(1).build());
        return new QuizData(quiz, question, correct, wrong);
    }

    private record QuizData(Quiz quiz, QuizQuestion question, QuizOption correct, QuizOption wrong) {
    }
}
