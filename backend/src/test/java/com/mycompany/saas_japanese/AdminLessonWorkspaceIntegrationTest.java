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

import java.math.BigDecimal;
import java.util.UUID;

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

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.KanjiRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.VocabularyRepository;

import jakarta.persistence.EntityManager;

@Transactional
class AdminLessonWorkspaceIntegrationTest extends AuthTestSupport {
  @Autowired private WebApplicationContext context;
  @Autowired private CourseCategoryRepository categories;
  @Autowired private CourseRepository courses;
  @Autowired private LessonRepository lessons;
  @Autowired private VocabularyRepository vocabularies;
  @Autowired private KanjiRepository kanjis;
  @Autowired private EntityManager entityManager;
  private MockMvc mvc;
  private Course course;
  private Lesson lesson;
  private Lesson other;

  @BeforeEach
  void setup() {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    String slug = UUID.randomUUID().toString();
    var category = categories.save(CourseCategory.builder().name("Workspace").slug(slug).build());
    course = courses.save(Course.builder().category(category).title("Workspace").slug(slug)
        .price(BigDecimal.ZERO).build());
    lesson = lessons.save(Lesson.builder().course(course).title("Original").slug(slug)
        .grammar("<h2>Saved grammar</h2>").build());
    other = lessons.save(Lesson.builder().course(course).title("Other").slug(slug + "-other").build());
  }

  @Test
  void metadataValidationAndCourseOwnershipAreAuthoritative() throws Exception {
    String path = "/api/v1/lessons/" + lesson.getId();
    mvc.perform(put(path).with(admin()).contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.title").exists());
    mvc.perform(put(path).with(admin()).contentType(MediaType.APPLICATION_JSON)
        .content(metadata(course.getId(), "   ", "-1")))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.title").exists())
        .andExpect(jsonPath("$.fieldErrors.durationMinutes").exists());
    mvc.perform(put(path).with(admin()).contentType(MediaType.APPLICATION_JSON)
        .content(metadata(Long.MAX_VALUE, "Wrong course", "5"))).andExpect(status().isNotFound());
    assertThat(lessons.findById(lesson.getId()).orElseThrow().getTitle()).isEqualTo("Original");
  }

  @Test
  void metadataPreservesOmittedGrammarAndNullableDurationAcrossReload() throws Exception {
    String path = "/api/v1/lessons/" + lesson.getId();
    mvc.perform(put(path).with(admin()).contentType(MediaType.APPLICATION_JSON)
        .content(metadata(course.getId(), "Renamed", "null")))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.durationMinutes").isEmpty())
        .andExpect(jsonPath("$.data.grammar").value("<h2>Saved grammar</h2>"));
    entityManager.flush();
    entityManager.clear();
    mvc.perform(get(path).with(admin())).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.title").value("Renamed"))
        .andExpect(jsonPath("$.data.grammar").value("<h2>Saved grammar</h2>"));
    mvc.perform(patch(path + "/grammar").with(admin()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"grammar\":\"\"}")).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.grammar").isEmpty());
  }

  @Test
  void scopedVocabularyCannotReadMoveOrDeleteAnotherLessonsRecord() throws Exception {
    var item = vocabularies.save(Vocabulary.builder().lesson(other).word("Original")
        .reading("reading").meaningVi("meaning").build());
    String path = "/api/v1/vocabularies/" + item.getId();
    mvc.perform(get(path).with(admin()).param("lessonId", lesson.getId().toString()))
        .andExpect(status().isNotFound());
    mvc.perform(put(path).with(admin()).param("lessonId", lesson.getId().toString())
        .contentType(MediaType.APPLICATION_JSON).content(vocabularyBody(lesson.getId())))
        .andExpect(status().isNotFound());
    mvc.perform(delete(path).with(admin()).param("lessonId", lesson.getId().toString()))
        .andExpect(status().isNotFound());
    mvc.perform(put(path).with(admin()).param("lessonId", other.getId().toString())
        .contentType(MediaType.APPLICATION_JSON).content(vocabularyBody(lesson.getId())))
        .andExpect(status().isBadRequest());
    entityManager.flush();
    entityManager.clear();
    var saved = vocabularies.findById(item.getId()).orElseThrow();
    assertThat(saved.getLesson().getId()).isEqualTo(other.getId());
    assertThat(saved.getWord()).isEqualTo("Original");
    assertThat(saved.getDeletedAt()).isNull();
  }

  @Test
  void scopedKanjiCannotReadMoveOrDeleteAnotherLessonsRecord() throws Exception {
    var item = kanjis.save(Kanji.builder().lesson(other).kanji("月").meaningVi("moon").build());
    String path = "/api/v1/kanjis/" + item.getId();
    mvc.perform(get(path).with(admin()).param("lessonId", lesson.getId().toString()))
        .andExpect(status().isNotFound());
    mvc.perform(put(path).with(admin()).param("lessonId", lesson.getId().toString())
        .contentType(MediaType.APPLICATION_JSON).content(kanjiBody(lesson.getId(), "日")))
        .andExpect(status().isNotFound());
    mvc.perform(delete(path).with(admin()).param("lessonId", lesson.getId().toString()))
        .andExpect(status().isNotFound());
    mvc.perform(put(path).with(admin()).param("lessonId", other.getId().toString())
        .contentType(MediaType.APPLICATION_JSON).content(kanjiBody(lesson.getId(), "日")))
        .andExpect(status().isBadRequest());
    entityManager.flush();
    entityManager.clear();
    var saved = kanjis.findById(item.getId()).orElseThrow();
    assertThat(saved.getLesson().getId()).isEqualTo(other.getId());
    assertThat(saved.getKanji()).isEqualTo("月");
    assertThat(saved.getDeletedAt()).isNull();
  }

  @Test
  void scopedListsValidateParentAndPagination() throws Exception {
    for (String path : new String[] {"/api/v1/vocabularies", "/api/v1/kanjis"}) {
      mvc.perform(get(path).with(admin()).param("lessonId", Long.toString(Long.MAX_VALUE)))
          .andExpect(status().isNotFound());
      mvc.perform(get(path).with(admin()).param("lessonId", lesson.getId().toString()).param("size", "0"))
          .andExpect(status().isBadRequest());
    }
  }

  @Test
  void deletedCourseCannotStillExposeOrMutateItsLessonContents() throws Exception {
    course.setIsDeleted(true);
    courses.saveAndFlush(course);
    String path = "/api/v1/lessons/" + lesson.getId();
    mvc.perform(get(path).with(admin())).andExpect(status().isNotFound());
    mvc.perform(patch(path + "/grammar").with(admin()).contentType(MediaType.APPLICATION_JSON)
        .content("{\"grammar\":\"Lost content\"}")).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/admin/lessons/" + lesson.getId() + "/quiz").with(admin()))
        .andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/vocabularies").with(admin()).param("lessonId", lesson.getId().toString()))
        .andExpect(status().isNotFound());
  }

  @Test
  void kanjiStoresTheSameTrimmedValueUsedForUniqueness() throws Exception {
    String character = "T" + lesson.getId();
    mvc.perform(post("/api/v1/kanjis").with(admin()).contentType(MediaType.APPLICATION_JSON)
        .content(kanjiBody(lesson.getId(), " " + character + " ")))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.data.kanji").value(character));
    entityManager.flush();
    entityManager.clear();
    mvc.perform(post("/api/v1/kanjis").with(admin()).contentType(MediaType.APPLICATION_JSON)
        .content(kanjiBody(lesson.getId(), character))).andExpect(status().isConflict());
  }

  @Test
  void kanjiUpdateHonorsTheSameUniquenessRuleAsCreate() throws Exception {
    kanjis.save(Kanji.builder().lesson(lesson).kanji("U" + lesson.getId()).meaningVi("one").build());
    var item = kanjis.save(Kanji.builder().lesson(lesson).kanji("O" + lesson.getId())
        .meaningVi("two").build());
    mvc.perform(put("/api/v1/kanjis/" + item.getId()).with(admin()).contentType(MediaType.APPLICATION_JSON)
        .content(kanjiBody(lesson.getId(), "U" + lesson.getId())))
        .andExpect(status().isConflict());
    assertThat(item.getKanji()).isEqualTo("O" + lesson.getId());
  }

  private RequestPostProcessor admin() {
    return jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
  }

  private String metadata(Long courseId, String title, String duration) {
    return "{\"title\":\"%s\",\"courseId\":%d,\"durationMinutes\":%s,\"isPublished\":false}"
        .formatted(title, courseId, duration);
  }

  private String vocabularyBody(Long lessonId) {
    return "{\"lessonId\":%d,\"word\":\"Changed\",\"reading\":\"reading\",\"meaningVi\":\"meaning\"}"
        .formatted(lessonId);
  }

  private String kanjiBody(Long lessonId, String kanji) {
    return "{\"lessonId\":%d,\"kanji\":\"%s\",\"meaningVi\":\"meaning\"}".formatted(lessonId, kanji);
  }
}
