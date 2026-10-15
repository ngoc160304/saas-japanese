package com.mycompany.saas_japanese.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.response.AdminJlptExamValidationResponse.Issue;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptQuestionEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;

@ExtendWith(MockitoExtension.class)
class JlptExamPublishValidatorTest {
  @Mock private JlptExamSessionRepository sessions;
  @Mock private JlptExamPartRepository parts;
  @Mock private JlptExamQuestionRepository questions;
  @Mock private JlptExamAnswerRepository answers;
  @Mock private MediaRepository media;
  @Mock private UserJlptAttemptRepository attempts;
  @InjectMocks private JlptExamPublishValidator validator;
  private JlptExam exam;
  private JlptExamSession session;
  private JlptExamPart part;
  private JlptExamQuestion question;
  private JlptExamAnswer correct;
  private JlptExamAnswer wrong;

  @BeforeEach
  void preparePersistedHierarchy() {
    exam = JlptExam.builder().id(1L).title("Exam").jlptLevel(JlptLevelEnum.N3).build();
    session = JlptExamSession.builder().id(2L).jlptExam(exam).name("Session")
        .sessionType(JlptSessionEnum.reading).timeLimitMinutes(10).sortOrder(0).build();
    part = JlptExamPart.builder().id(3L).jlptExamSession(session).name("Part").sortOrder(0).build();
    question = JlptExamQuestion.builder().id(4L).jlptExamPart(part).questionText("Question")
        .questionType(JlptQuestionEnum.single_choice).points(BigDecimal.ONE).sortOrder(0).build();
    correct = JlptExamAnswer.builder().id(5L).jlptExamQuestion(question).answerText("Yes")
        .isCorrect(true).sortOrder(0).build();
    wrong = JlptExamAnswer.builder().id(6L).jlptExamQuestion(question).answerText("No")
        .isCorrect(false).sortOrder(1).build();
    when(sessions.findByJlptExamIdOrderBySortOrderAscIdAsc(1L)).thenReturn(List.of(session));
    when(parts.findAdminPartsBySessionIds(List.of(2L))).thenReturn(List.of(part));
    when(questions.findAdminQuestionsByPartIds(List.of(3L))).thenReturn(List.of(question));
    when(answers.findAdminAnswersByQuestionIds(List.of(4L))).thenReturn(List.of(correct, wrong));
  }

  @Test
  void nullLegacyFieldsProduceIssuesRatherThanAnUnhandledException() {
    exam.setJlptLevel(null);
    session.setSessionType(null);
    session.setTimeLimitMinutes(null);
    session.setSortOrder(null);
    question.setQuestionText(null);
    question.setQuestionType(null);
    question.setPoints(null);
    wrong.setIsCorrect(null);
    var report = validator.validate(exam);
    assertThat(report.canPublish()).isFalse();
    assertThat(report.issues()).extracting(Issue::code).contains("EXAM_LEVEL_REQUIRED", "SESSION_TYPE_UNSUPPORTED",
        "SESSION_DURATION_INVALID", "SORT_ORDER_INVALID", "TEXT_REQUIRED", "QUESTION_TYPE_UNSUPPORTED",
        "QUESTION_POINTS_INVALID", "ANSWER_CORRECTNESS_REQUIRED");
    Issue correctness = report.issues().stream().filter(issue -> issue.code().equals("ANSWER_CORRECTNESS_REQUIRED"))
        .findFirst().orElseThrow();
    assertThat(correctness.path()).isEqualTo("sessions[2].parts[3].questions[4].answers[6].isCorrect");
    assertThat(correctness.resourceIds()).containsEntry("examId", 1L).containsEntry("sessionId", 2L)
        .containsEntry("partId", 3L).containsEntry("questionId", 4L).containsEntry("answerId", 6L);
  }

  @ParameterizedTest
  @ValueSource(strings = {"-1", "0", "0.001", "1.001", "1000"})
  void pointsUseTheExistingDecimalConstraints(String points) {
    question.setPoints(new BigDecimal(points));
    assertThat(validator.validate(exam).issues()).extracting(Issue::code).containsExactly("QUESTION_POINTS_INVALID");
  }

  @ParameterizedTest
  @ValueSource(strings = {"0.01", "1.25", "999.99"})
  void pointsWithinTheExistingRangeArePublishable(String points) {
    question.setPoints(new BigDecimal(points));
    assertThat(validator.validate(exam).canPublish()).isTrue();
  }

  @Test
  void namesAndTextsKeepExistingLengthLimitsForLegacyData() {
    exam.setTitle("x".repeat(201));
    exam.setDescription("x".repeat(501));
    session.setName("x".repeat(151));
    part.setName("x".repeat(151));
    question.setQuestionText("x".repeat(20001));
    wrong.setAnswerText("x".repeat(501));
    assertThat(validator.validate(exam).issues()).extracting(Issue::code)
        .containsExactly("TEXT_TOO_LONG", "TEXT_TOO_LONG", "TEXT_TOO_LONG", "TEXT_TOO_LONG", "TEXT_TOO_LONG",
            "TEXT_TOO_LONG");
  }
}
