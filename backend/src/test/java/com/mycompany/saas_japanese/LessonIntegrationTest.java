package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.request.ReqCreateLesson;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.LessonService;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

@Transactional
class LessonIntegrationTest extends AuthTestSupport {
    @Autowired private WebApplicationContext context;
    @Autowired private CourseCategoryRepository categories;
    @Autowired private CourseRepository courses;
    @Autowired private LessonRepository lessons;
    @Autowired private MediaRepository media;
    @Autowired private LessonService service;
    @Autowired private EntityManager entityManager;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void createContractKeepsCourseAndValidatesInputs() throws Exception {
        Course course = course("Create");
        mvc.perform(post("/api/v1/lessons").with(jwt()).contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"courseId":%d,"title":"  New lesson  ","grammar":"Overview",
                     "durationMinutes":0,"isPublished":true}
                    """.formatted(course.getId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.courseId").value(course.getId()))
            .andExpect(jsonPath("$.data.title").value("New lesson"))
            .andExpect(jsonPath("$.data.grammar").value("Overview"))
            .andExpect(jsonPath("$.data.durationMinutes").value(0))
            .andExpect(jsonPath("$.data.isPublished").value(true));
        mvc.perform(post("/api/v1/lessons").with(jwt()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\" \",\"durationMinutes\":-1}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.courseId").exists())
            .andExpect(jsonPath("$.fieldErrors.title").exists())
            .andExpect(jsonPath("$.fieldErrors.durationMinutes").exists());
        mvc.perform(post("/api/v1/lessons").with(jwt()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"courseId\":9223372036854775807,\"title\":\"Missing\"}"))
            .andExpect(status().isNotFound());
        course.setIsDeleted(true);
        mvc.perform(post("/api/v1/lessons").with(jwt()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"courseId\":%d,\"title\":\"Deleted parent\"}".formatted(course.getId())))
            .andExpect(status().isNotFound());
    }

    @Test
    void deletePersistsSoftDeleteAndExcludesListDetailAndCounts() throws Exception {
        Course course = course("Delete");
        Lesson removed = lesson(course, "Removed");
        Lesson kept = lesson(course, "Kept");
        Lesson other = lesson(course("Other"), "Other");
        Long id = removed.getId();
        mvc.perform(delete("/api/v1/lessons/{id}", id).with(jwt())).andExpect(status().isOk());
        entityManager.flush();
        entityManager.clear();
        Lesson persisted = lessons.findById(id).orElseThrow();
        assertThat(persisted.getIsDeleted()).isTrue();
        assertThat(persisted.getDeletedAt()).isNotNull();
        assertThat(lessons.countByCourseIdAndIsDeletedFalse(course.getId())).isEqualTo(1);
        assertThat(lessons.findByIdAndIsDeletedFalse(other.getId())).isPresent();
        mvc.perform(get("/api/v1/lessons").with(jwt()).param("courseId", course.getId().toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1))
            .andExpect(jsonPath("$.data.content[0].id").value(kept.getId()));
        mvc.perform(get("/api/v1/lessons").with(jwt()).param("search", "Removed"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        mvc.perform(get("/api/v1/lessons/{id}", id).with(jwt())).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/lessons/{id}", id).with(jwt())).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/lessons/{id}", Long.MAX_VALUE).with(jwt()))
            .andExpect(status().isNotFound());
    }

    @Test
    void courseDeletionIsScopedAndRetainsPreviouslyDeletedTimestamp() throws Exception {
        Course course = course("Bulk");
        Lesson first = lesson(course, "First");
        Lesson prior = lesson(course, "Prior");
        Instant priorDeletion = Instant.parse("2026-01-01T00:00:00Z");
        prior.setIsDeleted(true);
        prior.setDeletedAt(priorDeletion);
        Lesson other = lesson(course("Unaffected"), "Other");
        mvc.perform(delete("/api/v1/lessons/course/{id}", course.getId()).with(jwt()))
            .andExpect(status().isOk());
        assertThat(first.getIsDeleted()).isTrue();
        assertThat(prior.getDeletedAt()).isEqualTo(priorDeletion);
        assertThat(other.getIsDeleted()).isFalse();
        assertThat(lessons.countByCourseIdAndIsDeletedFalse(course.getId())).isZero();
        assertThatThrownBy(() -> service.deleteByCourseId(Long.MAX_VALUE)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void videoUsageIsClaimedOnCreateAndReleasedOnDelete() {
        Course course = course("Video");
        Media video = media.save(Media.builder().fileName("video").publicId("lesson-test-video")
            .secureUrl("https://example.test/video").fileType(FileTypeEnum.VIDEO).isUsed(false).build());
        ReqCreateLesson request = new ReqCreateLesson();
        request.setCourseId(course.getId());
        request.setTitle("Video lesson");
        request.setVideoMediaId(video.getId());
        var response = service.createLesson(request);
        assertThat(video.getIsUsed()).isTrue();
        assertThatThrownBy(() -> service.createLesson(request)).isInstanceOf(BadRequestException.class);
        service.deleteLesson(response.getId());
        entityManager.flush();
        entityManager.clear();
        assertThat(media.findById(video.getId()).orElseThrow().getIsUsed()).isFalse();
        assertThat(lessons.findById(response.getId()).orElseThrow().getVideoMedia()).isNull();
        var replacement = service.createLesson(request);
        entityManager.flush();
        assertThat(replacement.getVideoMediaId()).isEqualTo(video.getId());
    }

    @Test
    void lessonWritesRequireAuthenticationAndListRejectsInvalidPagination() throws Exception {
        Lesson lesson = lesson(course("Protected"), "Protected");
        mvc.perform(post("/api/v1/lessons").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/lessons/{id}", lesson.getId())).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/lessons/course/{id}", lesson.getCourse().getId()))
            .andExpect(status().isUnauthorized());
        assertThat(lessons.findByIdAndIsDeletedFalse(lesson.getId())).isPresent();
        for (String size : new String[] {"0", "13"}) {
            mvc.perform(get("/api/v1/lessons").with(jwt()).param("size", size))
                .andExpect(status().isBadRequest());
        }
    }

    private Course course(String title) {
        CourseCategory category = categories.save(CourseCategory.builder().name(title).slug(title).build());
        return courses.save(Course.builder().category(category).title(title).slug(title)
            .price(BigDecimal.ZERO).build());
    }

    private Lesson lesson(Course course, String title) {
        return lessons.save(Lesson.builder().course(course).title(title).slug(title).build());
    }
}
