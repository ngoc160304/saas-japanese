package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.Stream;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import com.mycompany.saas_japanese.domain.query.AdminJlptExamQuery;
import com.mycompany.saas_japanese.domain.query.BaseQuery;
import com.mycompany.saas_japanese.domain.query.CourseCategoryQuery;
import com.mycompany.saas_japanese.domain.query.CourseEnrollmentQuery;
import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.query.JlptAttemptHistoryQuery;
import com.mycompany.saas_japanese.domain.query.JlptExamQuery;
import com.mycompany.saas_japanese.domain.query.KanjiQuery;
import com.mycompany.saas_japanese.domain.query.LessonQuery;
import com.mycompany.saas_japanese.domain.query.OrderQuery;
import com.mycompany.saas_japanese.domain.query.VocabularyQuery;

import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;

class BaseQueryValidationTest {
  private static final ValidatorFactory VALIDATORS = Validation.buildDefaultValidatorFactory();

  @AfterAll
  static void closeValidators() {
    VALIDATORS.close();
  }

  @ParameterizedTest
  @MethodSource("queries")
  void paginationBoundsAndDefaultsApplyToAllExistingConsumers(BaseQuery query) {
    var validator = VALIDATORS.getValidator();
    assertThat(validator.validate(query)).isEmpty();
    for (Integer size : new Integer[] {null, -1, 0, 13}) {
      query.setSize(size);
      assertThat(validator.validate(query)).anyMatch(error -> error.getPropertyPath().toString().equals("size"));
    }
    for (Integer size : new Integer[] {1, 10, 12}) {
      query.setSize(size);
      assertThat(validator.validate(query)).isEmpty();
    }
    for (Integer page : new Integer[] {null, -1}) {
      query.setPage(page);
      assertThat(validator.validate(query)).anyMatch(error -> error.getPropertyPath().toString().equals("page"));
    }
    query.setPage(0);
    assertThat(validator.validate(query)).isEmpty();
    query.setPage(1);
    assertThat(validator.validate(query)).isEmpty();
  }

  static Stream<BaseQuery> queries() {
    return Stream.of(new AdminJlptExamQuery(), new CourseCategoryQuery(), new CourseEnrollmentQuery(),
        new CourseQuerry(), new JlptAttemptHistoryQuery(), new JlptExamQuery(), new KanjiQuery(),
        new LessonQuery(), new OrderQuery(), new VocabularyQuery());
  }
}
