package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.repository.CourseCategoryRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.util.constant.UserRoleEnum;

/** Opt-in real HTTP/browser test. Chrome routes API requests to this disposable H2 server. */
@EnabledIfEnvironmentVariable(named = "LESSON_LIVE_BROWSER", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, properties = {
    "server.port=18080",
    "spring.datasource.url=jdbc:h2:mem:lesson-browser;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false",
    "brevo.api.key=",
    "cloudinary.cloud-name=test",
    "cloudinary.api-key=",
    "cloudinary.api-secret=",
    "AUTH_ALLOWED_ORIGINS=http://localhost:3000",
    "AUTH_COOKIE_SECURE=false",
    "AUTH_JWT_ISSUER=saas-japanese",
    "spring.main.banner-mode=off"
})
class AdminLessonWorkspaceBrowserTest extends AuthTestSupport {
  @Autowired private CourseCategoryRepository categories;
  @Autowired private CourseRepository courses;
  @Autowired private LessonRepository lessons;
  @Autowired private UserRepository users;
  @Autowired private PasswordEncoder encoder;

  @Test
  void realBrowserPersistsWorkspaceChanges() throws IOException, InterruptedException {
    String unique = UUID.randomUUID().toString();
    String password = UUID.randomUUID() + "Aa1!";
    var user = new User();
    user.setUsername("Workspace browser");
    user.setEmail(unique + "@example.test");
    user.setPassword(encoder.encode(password));
    user.setRole(UserRoleEnum.admin);
    user.setActive(true);
    user.setVerified(true);
    users.save(user);
    var category = categories.save(CourseCategory.builder().name("Browser").slug(unique).build());
    var course = courses.save(Course.builder().category(category).title("Browser course")
        .slug(unique).price(BigDecimal.ZERO).build());
    var lesson = lessons.save(Lesson.builder().course(course).title("Browser lesson")
        .slug(unique).grammar("<p>Original grammar</p>").build());
    var other = lessons.save(Lesson.builder().course(course).title("Other lesson")
        .slug(unique + "-other").grammar("<p>Other grammar</p>").build());
    var script = Path.of("..", "fontend", "tests", "lesson-workspace-live.browser.mjs").toAbsolutePath();
    var builder = new ProcessBuilder("node", script.toString()).inheritIO();
    builder.environment().put("LESSON_TEST_ORIGIN", "http://localhost:3000");
    builder.environment().put("LESSON_FIXTURE_EMAIL", user.getEmail());
    builder.environment().put("LESSON_FIXTURE_PASSWORD", password);
    builder.environment().put("LESSON_FIXTURE_COURSE", course.getId().toString());
    builder.environment().put("LESSON_FIXTURE_ID", lesson.getId().toString());
    builder.environment().put("LESSON_FIXTURE_OTHER", other.getId().toString());
    var browser = builder.start();
    try {
      assertThat(browser.waitFor(4, TimeUnit.MINUTES)).as("Browser completed").isTrue();
      assertThat(browser.exitValue()).isZero();
      var persisted = lessons.findById(lesson.getId()).orElseThrow();
      assertThat(persisted.getGrammar()).contains("Persisted browser grammar");
      assertThat(persisted.getTitle()).isEqualTo("Renamed browser lesson");
      assertThat(persisted.getDurationMinutes()).isNull();
      assertThat(persisted.getIsPublished()).isTrue();
    } finally {
      if (browser.isAlive()) {
        browser.destroyForcibly();
      }
    }
  }
}
