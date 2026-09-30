package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.response.ClientLessonResponse;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.CourseService;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;

@Transactional
class ClientCourseIntegrationTest extends AuthTestSupport {
    @Autowired private WebApplicationContext context;
    @Autowired private CourseRepository courses;
    @Autowired private CourseCategoryRepository categories;
    @Autowired private LessonRepository lessons;
    @Autowired private MediaRepository media;
    @Autowired private CourseService service;
    @Autowired private EntityManager entityManager;
    private final JsonMapper json = JsonMapper.builder().build();
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void anonymousDetailPreservesExistingFieldsAndIncludesSupportedMetadata() throws Exception {
        CourseCategory category = categories.save(CourseCategory.builder().name("Category").slug("category").build());
        Media thumbnail = media("thumbnail", FileTypeEnum.IMAGE);
        Course course = course("Public course", true, false);
        course.setCategory(category);
        course.setThumbnailMedia(thumbnail);
        course.setDescription("Course description");
        lesson(course, "Public lesson", true, false, 25);
        entityManager.flush();
        Instant updatedAt = course.getUpdatedAt();
        entityManager.clear();

        mvc.perform(get("/api/v1/client/courses/{id}", course.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statusCode").value(200))
            .andExpect(jsonPath("$.message").value("fetch client course detail"))
            .andExpect(jsonPath("$.data.id").value(course.getId()))
            .andExpect(jsonPath("$.data.title").value(course.getTitle()))
            .andExpect(jsonPath("$.data.slug").value(course.getSlug()))
            .andExpect(jsonPath("$.data.description").value("Course description"))
            .andExpect(jsonPath("$.data.categoryName").value(category.getName()))
            .andExpect(jsonPath("$.data.price").value(10))
            .andExpect(jsonPath("$.data.thumnailURL").value(thumbnail.getSecureUrl()))
            .andExpect(jsonPath("$.data.lessonCount").value(1))
            .andExpect(jsonPath("$.data.totalDurationMinutes").value(25))
            .andExpect(jsonPath("$.data.updatedAt").exists());
        assertThat(service.fetchClientCourseById(course.getId()).getUpdatedAt().truncatedTo(ChronoUnit.SECONDS))
            .isEqualTo(updatedAt.truncatedTo(ChronoUnit.SECONDS));
    }

    @ParameterizedTest
    @ValueSource(strings = {"missing", "unpublished", "deleted"})
    void bothEndpointsHideUnavailableParentCourses(String state) throws Exception {
        Long id = Long.MAX_VALUE;
        if (!"missing".equals(state)) {
            Course course = course(state, !"unpublished".equals(state), "deleted".equals(state));
            lesson(course, "Published child", true, false, 40);
            id = course.getId();
        }
        for (String suffix : List.of("", "/lessons")) {
            mvc.perform(get("/api/v1/client/courses/" + id + suffix))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.fieldErrors").isEmpty())
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.trace").doesNotExist());
        }
    }

    @Test
    void syllabusFiltersByCourseAndVisibilityAndOrdersByPersistedId() throws Exception {
        Course course = course("Syllabus", true, false);
        Lesson first = lesson(course, "Z first", true, false, 20);
        lesson(course, "Draft", false, false, 90);
        lesson(course, "Deleted", true, true, 100);
        Lesson second = lesson(course, "A second", true, false, null);
        lesson(course("Other", true, false), "Other lesson", true, false, 200);
        entityManager.flush();
        entityManager.clear();

        mvc.perform(get("/api/v1/client/courses/{id}/lessons", course.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("fetch client course lessons"))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].id").value(first.getId()))
            .andExpect(jsonPath("$.data[1].id").value(second.getId()));
        List<ClientLessonResponse> syllabus = service.fetchClientCourseLessons(course.getId());
        var detail = service.fetchClientCourseById(course.getId());
        assertThat(detail.getLessonCount()).isEqualTo((long) syllabus.size());
        assertThat(detail.getTotalDurationMinutes()).isEqualTo(syllabus.stream()
            .mapToLong(lesson -> lesson.durationMinutes() == null ? 0L : lesson.durationMinutes()).sum());
        assertThat(detail.getTotalDurationMinutes()).isEqualTo(20L);

        CourseQuerry query = new CourseQuerry();
        query.setSearch("Syllabus");
        assertThat(service.fetchAllClientCourses(query).getContent()).singleElement()
            .satisfies(item -> assertThat(item.getLessonCount()).isEqualTo(detail.getLessonCount()));
        // Admin counts still include non-deleted drafts.
        assertThat(service.fetchAllCourse(query).getContent()).singleElement()
            .satisfies(item -> assertThat(item.getLessonCount()).isEqualTo(3L));
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void validCourseWithoutPublicLessonsReturnsEmptyArrayAndZeroStatistics(boolean hiddenLessons) throws Exception {
        Course course = course("Empty", true, false);
        if (hiddenLessons) {
            lesson(course, "Draft", false, false, 50);
            lesson(course, "Deleted", true, true, 50);
        }
        mvc.perform(get("/api/v1/client/courses/{id}/lessons", course.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(get("/api/v1/client/courses/{id}", course.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.lessonCount").value(0))
            .andExpect(jsonPath("$.data.totalDurationMinutes").value(0))
            .andExpect(jsonPath("$.data.categoryName").isEmpty())
            .andExpect(jsonPath("$.data.thumnailURL").isEmpty());
    }

    @Test
    void unknownDurationsArePreservedWhileTheirSumIsZero() {
        Course course = course("Unknown duration", true, false);
        lesson(course, "Unknown", true, false, null);
        assertThat(service.fetchClientCourseLessons(course.getId())).singleElement()
            .satisfies(item -> assertThat(item.durationMinutes()).isNull());
        var detail = service.fetchClientCourseById(course.getId());
        assertThat(detail.getLessonCount()).isEqualTo(1L);
        assertThat(detail.getTotalDurationMinutes()).isZero();
    }

    @Test
    void totalDurationUsesLongArithmetic() {
        Course course = course("Long duration", true, false);
        lesson(course, "First", true, false, Integer.MAX_VALUE);
        lesson(course, "Second", true, false, Integer.MAX_VALUE);
        assertThat(service.fetchClientCourseById(course.getId()).getTotalDurationMinutes())
            .isEqualTo(2L * Integer.MAX_VALUE);
    }

    @Test
    void publicReadsUseBoundedQueriesRegardlessOfLessonCount() {
        Course course = course("Query count", true, false);
        for (int index = 0; index < 20; index++) {
            Lesson lesson = lesson(course, "Lesson " + index, true, false, 10);
            lesson.setVideoMedia(media("video-" + index, FileTypeEnum.VIDEO));
        }
        entityManager.flush();
        entityManager.clear();
        var statistics = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        boolean previouslyEnabled = statistics.isStatisticsEnabled();
        statistics.setStatisticsEnabled(true);
        try {
            statistics.clear();
            assertThat(service.fetchClientCourseLessons(course.getId())).hasSize(20);
            assertThat(statistics.getPrepareStatementCount()).isEqualTo(2);
            entityManager.clear();
            statistics.clear();
            assertThat(service.fetchClientCourseById(course.getId()).getTotalDurationMinutes()).isEqualTo(200L);
            assertThat(statistics.getPrepareStatementCount()).isEqualTo(2);
        } finally {
            statistics.setStatisticsEnabled(previouslyEnabled);
        }
    }

    @Test
    void publicJsonExposesOnlyMetadataAndFullLessonEndpointsRemainProtected() throws Exception {
        Course course = course("Paid", true, false);
        Lesson lesson = lesson(course, "Metadata", true, false, 30);
        lesson.setGrammar("Restricted learning content");
        lesson.setVideoMedia(media("restricted-video", FileTypeEnum.VIDEO));
        entityManager.flush();
        entityManager.clear();

        String response = mvc.perform(get("/api/v1/client/courses/{id}/lessons", course.getId()))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode item = json.readTree(response).get("data").get(0);
        assertThat(item.propertyNames()).containsExactlyInAnyOrder("id", "title", "slug", "durationMinutes");
        assertThat(item.get("title").asString()).isEqualTo(lesson.getTitle());
        assertThat(item.get("slug").asString()).isEqualTo(lesson.getSlug());
        assertThat(item.get("durationMinutes").asInt()).isEqualTo(30);
        assertThat(response).doesNotContain("Restricted learning content", "restricted-video");

        String detail = mvc.perform(get("/api/v1/client/courses/{id}", course.getId()))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(detail).get("data").propertyNames()).containsExactlyInAnyOrder(
            "id", "title", "slug", "description", "categoryName", "lessonCount", "price", "thumnailURL",
            "updatedAt", "totalDurationMinutes");
        mvc.perform(get("/api/v1/lessons/{id}", lesson.getId())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/lessons").param("courseId", course.getId().toString()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void publicListingKeepsItsShapeAndCannotExposeDraftOrDeletedCourses() throws Exception {
        Course course = course("Listing public", true, false);
        course("Listing draft", false, false);
        course("Listing deleted", true, true);
        lesson(course, "Draft", false, false, 20);
        String response = mvc.perform(get("/api/v1/client/courses").param("search", "Listing")
                .param("published", "false"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalElements").value(1))
            .andExpect(jsonPath("$.data.content[0].lessonCount").value(0))
            .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(response).get("data").get("content").get(0).propertyNames())
            .containsExactlyInAnyOrder("id", "title", "slug", "description", "categoryName", "lessonCount",
                "price", "thumnailURL");
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc", "9223372036854775808", "0", "-1"})
    void invalidIdsUseTheExistingErrorEnvelope(String id) throws Exception {
        int expectedStatus = "0".equals(id) || "-1".equals(id) ? 404 : 400;
        for (String suffix : List.of("", "/lessons")) {
            mvc.perform(get("/api/v1/client/courses/" + id + suffix))
                .andExpect(status().is(expectedStatus))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.trace").doesNotExist());
        }
    }

    private Course course(String title, boolean published, boolean deleted) {
        return courses.save(Course.builder().title(title)
            .slug(title.toLowerCase(java.util.Locale.ROOT).replace(' ', '-'))
            .price(BigDecimal.TEN).isPublished(published).isDeleted(deleted)
            .deletedAt(deleted ? Instant.now() : null).build());
    }

    private Lesson lesson(Course course, String title, boolean published, boolean deleted, Integer duration) {
        return lessons.save(Lesson.builder().course(course).title(title).slug(title.replace(' ', '-'))
            .isPublished(published).isDeleted(deleted).deletedAt(deleted ? Instant.now() : null)
            .durationMinutes(duration).build());
    }

    private Media media(String name, FileTypeEnum type) {
        return media.save(Media.builder().fileName(name).publicId(name)
            .secureUrl("https://example.test/" + name).fileType(type).build());
    }
}
