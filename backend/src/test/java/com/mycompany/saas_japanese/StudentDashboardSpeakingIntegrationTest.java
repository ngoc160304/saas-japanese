package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
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
import com.mycompany.saas_japanese.domain.CourseEnrollment;
import com.mycompany.saas_japanese.domain.SpeakingTopic;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.repository.CourseEnrollmentRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.SpeakingTopicRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.util.constant.UserRoleEnum;

@Transactional
class StudentDashboardSpeakingIntegrationTest extends AuthTestSupport {
  @Autowired private WebApplicationContext context;
  @Autowired private UserRepository users;
  @Autowired private CourseRepository courses;
  @Autowired private CourseEnrollmentRepository enrollments;
  @Autowired private SpeakingTopicRepository topics;
  private MockMvc mvc;

  @BeforeEach
  void setup() {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  @Test
  void dashboardCountsPersistedProgressForOnlyTheAuthenticatedUserAndActiveCourses() throws Exception {
    User student = user("student@example.test");
    User other = user("other@example.test");
    enrollment(student, "Not started", 0, false, false);
    enrollment(student, "In progress", 42, false, false);
    enrollment(student, "Complete by progress", 100, false, false);
    enrollment(student, "Complete by timestamp", 50, true, false);
    enrollment(student, "Deleted", 100, true, true);
    enrollment(other, "Other account", 20, false, false);
    mvc.perform(get("/api/v1/student/dashboard").with(jwt().jwt(token -> token.subject(student.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.enrolledCourses").value(4))
        .andExpect(jsonPath("$.data.notStartedCourses").value(1))
        .andExpect(jsonPath("$.data.inProgressCourses").value(1))
        .andExpect(jsonPath("$.data.completedCourses").value(2));
    mvc.perform(get("/api/v1/courses/my-courses")
        .with(jwt().jwt(token -> token.subject(student.getEmail()))))
        .andExpect(jsonPath("$.data.totalElements").value(4))
        .andExpect(jsonPath("$.data.content[0].Id").isNumber());
  }

  @Test
  void emptyDashboardReturnsGenuineZeroAndPrivateEndpointsRequireAuthentication() throws Exception {
    User empty = user("empty@example.test");
    mvc.perform(get("/api/v1/student/dashboard")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/speaking/topics")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/student/dashboard").with(jwt().jwt(token -> token.subject(empty.getEmail()))))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.enrolledCourses").value(0))
        .andExpect(jsonPath("$.data.inProgressCourses").value(0))
        .andExpect(jsonPath("$.data.completedCourses").value(0));
  }

  @Test
  void speakingTopicsArePersistedPaginatedAndFilteredWithAdminOnlyCreation() throws Exception {
    String body = "{\"title\":\"  Du lịch  \",\"description\":\" Hội thoại tại nhà ga \"}";
    mvc.perform(post("/api/v1/admin/speaking/topics").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/admin/speaking/topics").with(jwt().authorities(
        new SimpleGrantedAuthority("ROLE_STUDENT"))).contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/admin/speaking/topics").with(jwt().authorities(
        new SimpleGrantedAuthority("ROLE_ADMIN"))).contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.data.title").value("Du lịch"));
    assertThat(topics.findAll()).hasSize(1);
    topic("Published", true, false);
    topic("Draft", false, false);
    topic("Deleted", true, true);
    mvc.perform(get("/api/v1/speaking/topics").with(jwt()).param("size", "1").param("page", "1"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(2))
        .andExpect(jsonPath("$.data.content[0].title").value("Published"));
    mvc.perform(get("/api/v1/speaking/topics").with(jwt()).param("size", "0"))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/v1/admin/speaking/topics").with(jwt().authorities(
        new SimpleGrantedAuthority("ROLE_ADMIN"))).contentType(MediaType.APPLICATION_JSON)
        .content("{\"title\":\" \",\"description\":\"Missing title\"}")).andExpect(status().isBadRequest());
  }

  private User user(String email) {
    User user = new User();
    user.setEmail(email);
    user.setUsername("Student");
    user.setRole(UserRoleEnum.student);
    user.setActive(true);
    user.setVerified(true);
    return users.save(user);
  }

  private void enrollment(User user, String title, int progress, boolean completed, boolean deleted) {
    Course course = courses.save(Course.builder().title(title).slug(title.toLowerCase(Locale.ROOT).replace(' ', '-'))
        .price(BigDecimal.ZERO).isPublished(true).isDeleted(deleted).build());
    enrollments.save(CourseEnrollment.builder().user(user).course(course)
        .progressPercent(BigDecimal.valueOf(progress)).completedAt(completed ? Instant.now() : null).build());
  }

  private void topic(String title, boolean published, boolean deleted) {
    SpeakingTopic topic = new SpeakingTopic();
    topic.setTitle(title);
    topic.setDescription("Persisted description");
    topic.setPublished(published);
    topic.setDeleted(deleted);
    topics.save(topic);
  }
}
