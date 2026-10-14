package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Kanji;
import com.mycompany.saas_japanese.domain.Vocabulary;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.KanjiRepository;
import com.mycompany.saas_japanese.repository.VocabularyRepository;

@Transactional
class LessonContentIntegrationTest extends AuthTestSupport {
    @Autowired private WebApplicationContext context;
    @Autowired private CourseCategoryRepository categories;
    @Autowired private CourseRepository courses;
    @Autowired private LessonRepository lessons;
    @Autowired private VocabularyRepository vocabularies;
    @Autowired private KanjiRepository kanjis;
    @Autowired private EntityManager entityManager;
    private MockMvc mvc;
    private Lesson lesson;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        CourseCategory category = categories.save(CourseCategory.builder().name("Content").slug("content").build());
        Course course = courses.save(Course.builder().category(category).title("Content").slug("content")
                .price(BigDecimal.ZERO).build());
        lesson = lessons.save(Lesson.builder().course(course).title("Draft").slug("draft")
                .grammar("Keep grammar").build());
    }

    @Test
    void vocabularyCrudPersistsExamplesAndSoftDeletion() throws Exception {
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        mvc.perform(post("/api/v1/vocabularies").with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(vocabularyBody(lesson.getId(), "コーヒー / coffee!")))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.data.lessonId").value(lesson.getId()));
        Vocabulary created = vocabularies.findAllByLessonIdAndDeletedAtIsNull(lesson.getId()).get(0);
        mvc.perform(put("/api/v1/vocabularies/{id}", created.getId()).with(admin)
                .contentType(MediaType.APPLICATION_JSON).content(vocabularyBody(lesson.getId(), "珈琲")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.word").value("珈琲"))
            .andExpect(jsonPath("$.data.partOfSpeech").value("自由な分類"))
            .andExpect(jsonPath("$.data.exampleSentenceJp").value("一行\n二行"));
        entityManager.flush();
        entityManager.clear();
        assertThat(vocabularies.findById(created.getId()).orElseThrow().getWord()).isEqualTo("珈琲");
        mvc.perform(delete("/api/v1/vocabularies/{id}", created.getId()).with(admin))
            .andExpect(status().isNoContent()).andExpect(content().string(""));
        entityManager.flush();
        entityManager.clear();
        assertThat(vocabularies.findById(created.getId()).orElseThrow().getDeletedAt()).isNotNull();
        mvc.perform(get("/api/v1/vocabularies/{id}", created.getId()).with(admin)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/vocabularies/{id}", created.getId()).with(admin)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/vocabularies").with(admin).param("lessonId", lesson.getId().toString()))
            .andExpect(jsonPath("$.data.totalElements").value(0));
        assertThat(lessons.findById(lesson.getId()).orElseThrow().getGrammar()).isEqualTo("Keep grammar");
    }

    @Test
    void kanjiCrudAcceptsSupplementaryUnicodeAndNullStrokeCount() throws Exception {
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        mvc.perform(post("/api/v1/kanjis").with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(kanjiBody(lesson.getId(), "𠮷", "null")))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.data.strokeCount").isEmpty());
        Kanji created = kanjis.findAllByLessonIdAndDeletedAtIsNull(lesson.getId()).get(0);
        mvc.perform(post("/api/v1/kanjis").with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(kanjiBody(lesson.getId(), "𠮷", "null"))).andExpect(status().isConflict());
        mvc.perform(put("/api/v1/kanjis/{id}", created.getId()).with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(kanjiBody(lesson.getId(), "吉", "6")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.strokeCount").value(6));
        entityManager.flush();
        entityManager.clear();
        assertThat(kanjis.findById(created.getId()).orElseThrow().getExampleWords()).isEqualTo("吉日: ngày tốt");
        mvc.perform(delete("/api/v1/kanjis/{id}", created.getId()).with(admin))
            .andExpect(status().isNoContent()).andExpect(content().string(""));
        entityManager.flush();
        entityManager.clear();
        assertThat(kanjis.findById(created.getId()).orElseThrow().getDeletedAt()).isNotNull();
        mvc.perform(put("/api/v1/kanjis/{id}", created.getId()).with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(kanjiBody(lesson.getId(), "吉", "6"))).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/kanjis").with(admin).param("lessonId", lesson.getId().toString()))
            .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void kanjiReassignmentAndOptionalLessonRemainSupported() throws Exception {
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        Lesson other = lessons.save(Lesson.builder().course(lesson.getCourse()).title("Other").slug("other").build());
        Kanji item = kanjis.save(Kanji.builder().lesson(other).kanji("月").meaningVi("trăng").build());
        mvc.perform(put("/api/v1/kanjis/{id}", item.getId()).with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(kanjiBody(lesson.getId(), "月", "null")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.lessonId").value(lesson.getId()));
        mvc.perform(put("/api/v1/kanjis/{id}", item.getId()).with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(kanjiBody(null, "月", "null")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.lessonId").isEmpty());
        entityManager.flush();
        entityManager.clear();
        assertThat(kanjis.findById(item.getId()).orElseThrow().getLesson()).isNull();
    }

    @Test
    void mutationsRequireAdminAndReadsKeepExistingAuthenticatedPolicy() throws Exception {
        for (String path : new String[] {"/api/v1/vocabularies", "/api/v1/kanjis"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(get(path).with(jwt())).andExpect(status().isOk());
            mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
            mvc.perform(post(path).with(jwt()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
            mvc.perform(put(path + "/1").with(jwt()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
            mvc.perform(delete(path + "/1").with(jwt())).andExpect(status().isForbidden());
        }
    }

    @Test
    void rejectsInvalidFieldsAndDeletedParentOnCreateAndUpdate() throws Exception {
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        mvc.perform(post("/api/v1/vocabularies").with(admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"word\":\" \",\"reading\":\"\",\"meaningVi\":\"\",\"exampleSentenceJp\":\""
                        + "x".repeat(1001) + "\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.word").exists())
            .andExpect(jsonPath("$.fieldErrors.reading").exists())
            .andExpect(jsonPath("$.fieldErrors.meaningVi").exists())
            .andExpect(jsonPath("$.fieldErrors.exampleSentenceJp").exists());
        mvc.perform(post("/api/v1/kanjis").with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(kanjiBody(lesson.getId(), "日", "0")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.strokeCount").exists());
        Vocabulary vocabulary = vocabularies.save(Vocabulary.builder().lesson(lesson).word("word")
                .reading("reading").meaningVi("meaning").build());
        Kanji kanji = kanjis.save(Kanji.builder().lesson(lesson).kanji("日").meaningVi("ngày").build());
        lesson.setIsDeleted(true);
        for (Long parentId : new Long[] {lesson.getId(), Long.MAX_VALUE}) {
            mvc.perform(post("/api/v1/vocabularies").with(admin).contentType(MediaType.APPLICATION_JSON)
                    .content(vocabularyBody(parentId, "新"))).andExpect(status().isNotFound());
            mvc.perform(post("/api/v1/kanjis").with(admin).contentType(MediaType.APPLICATION_JSON)
                    .content(kanjiBody(parentId, "月", "null"))).andExpect(status().isNotFound());
            mvc.perform(put("/api/v1/vocabularies/{id}", vocabulary.getId()).with(admin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(vocabularyBody(parentId, "新"))).andExpect(status().isNotFound());
            mvc.perform(put("/api/v1/kanjis/{id}", kanji.getId()).with(admin).contentType(MediaType.APPLICATION_JSON)
                    .content(kanjiBody(parentId, "月", "null"))).andExpect(status().isNotFound());
        }
    }

    @Test
    void paginatesFullLessonAndPreservesReassignmentForOtherConsumers() throws Exception {
        var admin = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
        for (int index = 0; index < 13; index++) {
            vocabularies.save(Vocabulary.builder().lesson(lesson).word("word" + index)
                    .reading("reading").meaningVi("meaning").build());
        }
        Lesson other = lessons.save(Lesson.builder().course(lesson.getCourse()).title("Other").slug("other").build());
        Vocabulary item = vocabularies.save(Vocabulary.builder().lesson(other).word("word")
                .reading("reading").meaningVi("meaning").build());
        mvc.perform(get("/api/v1/vocabularies").with(admin).param("lessonId", lesson.getId().toString())
                .param("page", "1").param("size", "12").param("sortKey", "lessonId"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(13))
            .andExpect(jsonPath("$.data.totalPages").value(2)).andExpect(jsonPath("$.data.content.length()").value(1));
        mvc.perform(put("/api/v1/vocabularies/{id}", item.getId()).with(admin).contentType(MediaType.APPLICATION_JSON)
                .content(vocabularyBody(lesson.getId(), "word")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.lessonId").value(lesson.getId()));
    }

    private String vocabularyBody(Long lessonId, String word) {
        return """
                {"lessonId":%d,"word":"%s","reading":"よみ","meaningVi":"nghĩa",\
                 "partOfSpeech":"自由な分類","exampleSentenceJp":"一行\\n二行","exampleSentenceVi":""}\
                """.formatted(lessonId, word);
    }

    private String kanjiBody(Long lessonId, String kanji, String strokeCount) {
        return """
                {"lessonId":%d,"kanji":"%s","meaningVi":"nghĩa","strokeCount":%s,\
                 "onyomi":"キチ、キツ","kunyomi":"よ.い","exampleWords":"吉日: ngày tốt"}\
                """.formatted(lessonId, kanji, strokeCount);
    }
}
