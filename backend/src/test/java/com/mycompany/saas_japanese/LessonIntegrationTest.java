package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.request.ReqCreateLesson;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLesson;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.LessonService;
import com.mycompany.saas_japanese.service.UploadService;
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
    @MockitoBean private UploadService uploads;
    @Autowired private EntityManager entityManager;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void createContractKeepsCourseAndValidatesInputs() throws Exception {
        Course course = course("Create");
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        mvc.perform(post("/api/v1/lessons").with(admin).contentType(MediaType.APPLICATION_JSON)
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
        mvc.perform(post("/api/v1/lessons").with(admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\" \",\"durationMinutes\":-1}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.courseId").exists())
            .andExpect(jsonPath("$.fieldErrors.title").exists())
            .andExpect(jsonPath("$.fieldErrors.durationMinutes").exists());
        mvc.perform(post("/api/v1/lessons").with(admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"courseId\":9223372036854775807,\"title\":\"Missing\"}"))
            .andExpect(status().isNotFound());
        course.setIsDeleted(true);
        mvc.perform(post("/api/v1/lessons").with(admin).contentType(MediaType.APPLICATION_JSON)
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
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        mvc.perform(delete("/api/v1/lessons/{id}", id).with(admin)).andExpect(status().isOk());
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
        mvc.perform(delete("/api/v1/lessons/{id}", id).with(admin)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/lessons/{id}", Long.MAX_VALUE).with(admin))
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
        mvc.perform(delete("/api/v1/lessons/course/{id}", course.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
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
    void videoPatchAttachesReplacesAndDetachesWithoutChangingLessonContent() throws Exception {
        Course course = course("Video patch");
        Lesson lesson = lesson(course, "Video lifecycle");
        lesson.setGrammar("<p>Saved grammar</p>");
        lesson.setDurationMinutes(42);
        lesson.setIsPublished(true);
        Media first = media.save(Media.builder().fileName("first.mp4").publicId("first-video")
            .secureUrl("https://example.test/first.mp4").fileType(FileTypeEnum.VIDEO).isUsed(false).build());
        Media second = media.save(Media.builder().fileName("second.mp4").publicId("second-video")
            .secureUrl("https://example.test/second.mp4").fileType(FileTypeEnum.VIDEO).isUsed(false).build());
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        Long id = lesson.getId();

        mvc.perform(patch("/api/v1/lessons/{id}/video", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoMediaId\":" + first.getId() + "}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.videoMediaId").value(first.getId()));
        assertThat(first.getIsUsed()).isTrue();
        mvc.perform(patch("/api/v1/lessons/{id}/video", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoMediaId\":" + first.getId() + "}"))
            .andExpect(status().isOk());
        mvc.perform(patch("/api/v1/lessons/{id}/video", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoMediaId\":" + second.getId() + "}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.videoMediaId").value(second.getId()));
        assertThat(first.getIsUsed()).isFalse();
        assertThat(second.getIsUsed()).isTrue();
        mvc.perform(delete("/api/v1/lessons/{id}/video", id).with(admin))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.videoMediaId").isEmpty());
        mvc.perform(delete("/api/v1/lessons/{id}/video", id).with(admin))
            .andExpect(status().isOk());
        assertThat(second.getIsUsed()).isFalse();
        assertThat(lesson.getVideoMedia()).isNull();
        assertThat(lesson.getGrammar()).isEqualTo("<p>Saved grammar</p>");
        assertThat(lesson.getDurationMinutes()).isEqualTo(42);
        assertThat(lesson.getIsPublished()).isTrue();
        assertThat(lesson.getCourse().getId()).isEqualTo(course.getId());
    }

    @Test
    void videoPatchRejectsInvalidMediaAndNonAdminWrites() throws Exception {
        Lesson lesson = lesson(course("Video guard"), "Guarded video");
        Media image = media.save(Media.builder().fileName("image.png").publicId("image-video-guard")
            .secureUrl("https://example.test/image.png").fileType(FileTypeEnum.IMAGE).isUsed(false).build());
        Media deleted = media.save(Media.builder().fileName("deleted.mp4").publicId("deleted-video-guard")
            .secureUrl("https://example.test/deleted.mp4").fileType(FileTypeEnum.VIDEO)
            .isDeleted(true).isUsed(false).build());
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        var student = jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"));
        Long id = lesson.getId();
        mvc.perform(patch("/api/v1/lessons/{id}/video", id)
                .contentType(MediaType.APPLICATION_JSON).content("{\"videoMediaId\":1}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/v1/lessons/{id}/video", id).with(student)
                .contentType(MediaType.APPLICATION_JSON).content("{\"videoMediaId\":1}"))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/lessons/{id}/video", id).with(student))
            .andExpect(status().isForbidden());
        mvc.perform(multipart("/api/v1/upload/videos").file("file", new byte[] {1}).with(student))
            .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/lessons/{id}/video", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/lessons/{id}/video", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoMediaId\":" + image.getId() + "}"))
            .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/lessons/{id}/video", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoMediaId\":" + deleted.getId() + "}"))
            .andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/lessons/{id}/video", Long.MAX_VALUE).with(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoMediaId\":" + image.getId() + "}"))
            .andExpect(status().isNotFound());
        assertThat(lesson.getVideoMedia()).isNull();
        assertThat(image.getIsUsed()).isFalse();
        Lesson owner = lesson(course("Video owner"), "Owner");
        Media owned = media.save(Media.builder().fileName("owned.mp4").publicId("owned-video")
            .secureUrl("https://example.test/owned.mp4").fileType(FileTypeEnum.VIDEO).isUsed(false).build());
        service.attachVideo(owner.getId(), owned.getId());
        mvc.perform(patch("/api/v1/lessons/{id}/video", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoMediaId\":" + owned.getId() + "}"))
            .andExpect(status().isBadRequest());
        ReqCreateLesson create = new ReqCreateLesson();
        create.setCourseId(lesson.getCourse().getId());
        create.setTitle("Image is not video");
        create.setVideoMediaId(image.getId());
        assertThatThrownBy(() -> service.createLesson(create)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void adminVideoUploadUsesFileFieldAndReturnsPersistedMediaReference() throws Exception {
        Media saved = Media.builder().id(91L).fileName("lesson.mp4").originalName("lesson.mp4")
            .publicId("mock-video").secureUrl("https://example.test/lesson.mp4")
            .fileType(FileTypeEnum.VIDEO).isUsed(false).build();
        when(uploads.uploadVideo(any())).thenReturn(saved);
        mvc.perform(multipart("/api/v1/upload/videos")
                .file(new MockMultipartFile("file", "lesson.mp4", "video/mp4", new byte[] {1}))
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(91))
            .andExpect(jsonPath("$.data.secureUrl").value("https://example.test/lesson.mp4"))
            .andExpect(jsonPath("$.data.publicId").value("mock-video"))
            .andExpect(jsonPath("$.data.fileName").doesNotExist());
    }

    @Test
    void legacyPutKeepsVideoWhenOmittedAndReplacesItWhenRequested() {
        Course course = course("Video PUT");
        Lesson lesson = lesson(course, "Video PUT lesson");
        Media first = media.save(Media.builder().fileName("put-first.mp4").publicId("put-first")
            .secureUrl("https://example.test/put-first.mp4").fileType(FileTypeEnum.VIDEO).isUsed(false).build());
        Media second = media.save(Media.builder().fileName("put-second.mp4").publicId("put-second")
            .secureUrl("https://example.test/put-second.mp4").fileType(FileTypeEnum.VIDEO).isUsed(false).build());
        service.attachVideo(lesson.getId(), first.getId());
        ReqUpdateLesson request = new ReqUpdateLesson();
        request.setCourseId(course.getId());
        request.setTitle("Video PUT lesson");
        request.setSlug(lesson.getSlug());
        request.setGrammar("<p>Metadata edit</p>");
        request.setDurationMinutes(12);
        request.setIsPublished(false);
        assertThat(service.updateLesson(lesson.getId(), request).getVideoMediaId()).isEqualTo(first.getId());
        assertThat(first.getIsUsed()).isTrue();
        request.setVideoMediaId(second.getId());
        assertThat(service.updateLesson(lesson.getId(), request).getVideoMediaId()).isEqualTo(second.getId());
        assertThat(first.getIsUsed()).isFalse();
        assertThat(second.getIsUsed()).isTrue();
    }

    @Test
    void adminPatchesOnlyTheirFieldAndSanitizesGrammar() throws Exception {
        Course course = course("Patch");
        Media video = media.save(Media.builder().fileName("patch-video").publicId("lesson-patch-video")
            .secureUrl("https://example.test/patch-video").fileType(FileTypeEnum.VIDEO).isUsed(true).build());
        Lesson lesson = lessons.save(Lesson.builder().course(course).title("Patch lesson")
            .slug("patch-lesson").durationMinutes(32).isPublished(false).videoMedia(video).build());
        Long id = lesson.getId();
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));

        String unsafeGrammar = "<h2>Heading</h2><p><strong>Bold</strong> "
            + "<a href='javascript:alert(1)' onclick='alert(1)'>bad</a> "
            + "<a href='https://example.test'>safe</a></p><script>alert(1)</script>";
        mvc.perform(patch("/api/v1/lessons/{id}/grammar", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"grammar\":\"" + unsafeGrammar + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.isPublished").value(false))
            .andExpect(jsonPath("$.data.title").value("Patch lesson"))
            .andExpect(jsonPath("$.data.durationMinutes").value(32))
            .andExpect(jsonPath("$.data.videoMediaId").value(video.getId()));
        entityManager.flush();
        entityManager.clear();
        Lesson grammarSaved = lessons.findById(id).orElseThrow();
        assertThat(grammarSaved.getGrammar()).contains("<h2>Heading</h2>", "<strong>Bold</strong>",
            "https://example.test");
        assertThat(grammarSaved.getGrammar()).doesNotContain("javascript:", "onclick", "<script");

        mvc.perform(patch("/api/v1/lessons/{id}/publication", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"isPublished\":true}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.isPublished").value(true));
        entityManager.flush();
        entityManager.clear();
        Lesson published = lessons.findById(id).orElseThrow();
        assertThat(published.getGrammar()).isEqualTo(grammarSaved.getGrammar());
        assertThat(published.getVideoMedia().getId()).isEqualTo(video.getId());
        assertThat(published.getTitle()).isEqualTo("Patch lesson");
        assertThat(published.getDurationMinutes()).isEqualTo(32);
        assertThat(published.getCourse().getId()).isEqualTo(course.getId());

        mvc.perform(patch("/api/v1/lessons/{id}/grammar", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"grammar\":\"\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.grammar").isEmpty());
        entityManager.flush();
        entityManager.clear();
        assertThat(lessons.findById(id).orElseThrow().getGrammar()).isNull();
        assertThat(lessons.findById(id).orElseThrow().getIsPublished()).isTrue();
    }

    @Test
    void lessonGrammarWritesRequireAdminAndValidateRequests() throws Exception {
        Lesson lesson = lesson(course("Guard"), "Guarded");
        Long id = lesson.getId();
        var student = jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"));
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        mvc.perform(patch("/api/v1/lessons/{id}/grammar", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"grammar\":\"test\"}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/v1/lessons/{id}/grammar", id).with(student)
                .contentType(MediaType.APPLICATION_JSON).content("{\"grammar\":\"test\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/lessons/{id}/publication", id).with(student)
                .contentType(MediaType.APPLICATION_JSON).content("{\"isPublished\":true}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/lessons").with(student).contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/lessons/{id}", id).with(student)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/lessons/{id}", id).with(student))
            .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/lessons/{id}/grammar", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.grammar").exists());
        mvc.perform(patch("/api/v1/lessons/{id}/publication", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.isPublished").exists());
        mvc.perform(patch("/api/v1/lessons/{id}/grammar", Long.MAX_VALUE).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"grammar\":\"test\"}"))
            .andExpect(status().isNotFound());
        lesson.setIsDeleted(true);
        mvc.perform(patch("/api/v1/lessons/{id}/publication", id).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"isPublished\":true}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void createAndPutCannotBypassGrammarSanitization() throws Exception {
        Course course = course("Sanitized writes");
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        String unsafeCreate = "{\"courseId\":" + course.getId() + ",\"title\":\"Safe\",\"grammar\":\""
            + "<p onmouseover='alert(1)'>Text</p><iframe src='javascript:alert(1)'></iframe>\"}";
        String createResponse = mvc.perform(post("/api/v1/lessons").with(admin)
                .contentType(MediaType.APPLICATION_JSON).content(unsafeCreate))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        assertThat(createResponse).contains("<p>Text</p>").doesNotContain("onmouseover", "iframe");
        Lesson created = lessons.findAll().stream().filter(item -> "Safe".equals(item.getTitle()))
            .findFirst().orElseThrow();
        mvc.perform(put("/api/v1/lessons/{id}", created.getId()).with(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"courseId":%d,"title":"Safe","slug":"safe","durationMinutes":0,
                     "isPublished":false,"grammar":"<h3>Heading</h3><a href='javascript:alert(1)'>unsafe</a>"}
                    """.formatted(course.getId())))
            .andExpect(status().isOk());
        entityManager.flush();
        entityManager.clear();
        assertThat(lessons.findById(created.getId()).orElseThrow().getGrammar())
            .contains("<h3>Heading</h3>").doesNotContain("javascript:");
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void detailAndCourseListMapVideoMediaAfterRepositoryAccess() throws Exception {
        Course course = course("Read contract");
        Long categoryId = course.getCategory().getId();
        Media video = media.save(Media.builder().fileName("read-video").publicId("lesson-read-video")
            .secureUrl("https://example.test/read-video").fileType(FileTypeEnum.VIDEO).isUsed(true).build());
        Lesson lesson = lessons.save(Lesson.builder().course(course).title("Readable lesson")
            .slug("readable-lesson").videoMedia(video).build());

        try {
            mvc.perform(get("/api/v1/lessons/{id}", lesson.getId()).with(jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(lesson.getId()))
                .andExpect(jsonPath("$.data.courseId").value(course.getId()))
                .andExpect(jsonPath("$.data.videoMediaId").value(video.getId()))
                .andExpect(jsonPath("$.data.videoUrl").value(video.getSecureUrl()));

            mvc.perform(get("/api/v1/lessons").with(jwt())
                    .param("courseId", course.getId().toString())
                    .param("page", "0")
                    .param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(lesson.getId()))
                .andExpect(jsonPath("$.data.content[0].courseId").value(course.getId()))
                .andExpect(jsonPath("$.data.content[0].videoMediaId").value(video.getId()))
                .andExpect(jsonPath("$.data.content[0].videoUrl").value(video.getSecureUrl()));
        } finally {
            lessons.deleteById(lesson.getId());
            media.deleteById(video.getId());
            courses.deleteById(course.getId());
            categories.deleteById(categoryId);
        }
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
