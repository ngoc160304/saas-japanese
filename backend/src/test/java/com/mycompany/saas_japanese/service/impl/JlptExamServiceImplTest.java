package com.mycompany.saas_japanese.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.UserJlptAttempt;
import com.mycompany.saas_japanese.domain.UserJlptAttemptAnswer;
import com.mycompany.saas_japanese.domain.UserJlptAttemptPart;
import com.mycompany.saas_japanese.domain.UserJlptAttemptSession;
import com.mycompany.saas_japanese.domain.query.JlptAttemptHistoryQuery;
import com.mycompany.saas_japanese.domain.request.ReqSaveJlptAnswer;
import com.mycompany.saas_japanese.domain.response.JlptAttemptHistoryResponse;
import com.mycompany.saas_japanese.domain.response.JlptAttemptReviewResponse;
import com.mycompany.saas_japanese.domain.response.JlptAttemptResultResponse;
import com.mycompany.saas_japanese.domain.response.SaveJlptAnswerResponse;
import com.mycompany.saas_japanese.domain.response.SubmitJlptAttemptResponse;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptAnswerRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptPartRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptSessionRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.mapper.JlptExamMapper;
import com.mycompany.saas_japanese.util.constant.JlptAttemptStatusEnum;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;
import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.ForbiddenException;

@ExtendWith(MockitoExtension.class)
class JlptExamServiceImplTest {

    private static final Long USER_ID = 10L;
    private static final Long ATTEMPT_ID = 20L;
    private static final Long ATTEMPT_SESSION_ID = 30L;
    private static final Long EXAM_SESSION_ID = 40L;
    private static final Long QUESTION_ID = 50L;
    private static final Long ANSWER_ID = 60L;
    private static final String USER_EMAIL = "learner@example.com";

    @Mock
    private JlptExamRepository jlptExamRepository;

    @Mock
    private JlptExamMapper jlptExamMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JlptExamSessionRepository jlptExamSessionRepository;

    @Mock
    private JlptExamPartRepository jlptExamPartRepository;

    @Mock
    private JlptExamAnswerRepository jlptExamAnswerRepository;

    @Mock
    private JlptExamQuestionRepository jlptExamQuestionRepository;

    @Mock
    private UserJlptAttemptSessionRepository userJlptAttemptSessionRepository;

    @Mock
    private UserJlptAttemptPartRepository userJlptAttemptPartRepository;

    @Mock
    private UserJlptAttemptAnswerRepository userJlptAttemptAnswerRepository;

    @Mock
    private UserJlptAttemptRepository userJlptAttemptRepository;

    @InjectMocks
    private JlptExamServiceImpl jlptExamService;

    @BeforeEach
    void setUpAuthentication() {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(USER_EMAIL, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void saveAnswerInsertsFirstSelectionWithoutCalculatingCorrectness() {
        UserJlptAttempt attempt = stubInProgressAttempt();
        UserJlptAttemptSession attemptSession = stubInProgressAttemptSession(attempt);
        JlptExamQuestion question = stubQuestionInSession(EXAM_SESSION_ID);
        JlptExamAnswer selectedAnswer = stubAnswerForQuestion(question);

        when(userJlptAttemptAnswerRepository
                .findBySessionAttempt_IdAndJlptExamQuestion_Id(ATTEMPT_SESSION_ID, QUESTION_ID))
                .thenReturn(Optional.empty());
        when(userJlptAttemptAnswerRepository.save(any(UserJlptAttemptAnswer.class)))
                .thenAnswer(invocation -> {
                    UserJlptAttemptAnswer savedAnswer = invocation.getArgument(0);
                    savedAnswer.setId(70L);
                    return savedAnswer;
                });

        SaveJlptAnswerResponse response = jlptExamService.saveAnswer(
                ATTEMPT_ID,
                ATTEMPT_SESSION_ID,
                request());

        ArgumentCaptor<UserJlptAttemptAnswer> captor =
                ArgumentCaptor.forClass(UserJlptAttemptAnswer.class);
        verify(userJlptAttemptAnswerRepository).save(captor.capture());

        UserJlptAttemptAnswer savedAnswer = captor.getValue();
        assertSame(attemptSession, savedAnswer.getSessionAttempt());
        assertSame(question, savedAnswer.getJlptExamQuestion());
        assertSame(selectedAnswer, savedAnswer.getJlptExamAnswer());
        assertFalse(savedAnswer.getIsCorrect());
        assertEquals(70L, response.getAttemptAnswerId());
        assertEquals(ANSWER_ID, response.getAnswerId());
    }

    @Test
    void saveAnswerUpdatesExistingSelectionInsteadOfCreatingDuplicate() {
        UserJlptAttempt attempt = stubInProgressAttempt();
        stubInProgressAttemptSession(attempt);
        JlptExamQuestion question = stubQuestionInSession(EXAM_SESSION_ID);
        JlptExamAnswer selectedAnswer = stubAnswerForQuestion(question);
        UserJlptAttemptAnswer existingAnswer = UserJlptAttemptAnswer.builder()
                .id(70L)
                .jlptExamQuestion(question)
                .jlptExamAnswer(JlptExamAnswer.builder().id(61L).build())
                .isCorrect(false)
                .answeredAt(Instant.EPOCH)
                .build();

        when(userJlptAttemptAnswerRepository
                .findBySessionAttempt_IdAndJlptExamQuestion_Id(ATTEMPT_SESSION_ID, QUESTION_ID))
                .thenReturn(Optional.of(existingAnswer));
        when(userJlptAttemptAnswerRepository.save(existingAnswer)).thenReturn(existingAnswer);

        SaveJlptAnswerResponse response = jlptExamService.saveAnswer(
                ATTEMPT_ID,
                ATTEMPT_SESSION_ID,
                request());

        verify(userJlptAttemptAnswerRepository).save(existingAnswer);
        assertSame(selectedAnswer, existingAnswer.getJlptExamAnswer());
        assertEquals(70L, response.getAttemptAnswerId());
    }

    @Test
    void saveAnswerRejectsAttemptOwnedByAnotherUser() {
        stubCurrentUser();
        when(userJlptAttemptRepository.findByIdAndUser_Id(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThrows(
                ForbiddenException.class,
                () -> jlptExamService.saveAnswer(ATTEMPT_ID, ATTEMPT_SESSION_ID, request()));

        verify(userJlptAttemptAnswerRepository, never()).save(any());
    }

    @Test
    void saveAnswerRejectsCompletedAttempt() {
        stubAttempt(JlptAttemptStatusEnum.COMPLETED);

        assertThrows(
                BadRequestException.class,
                () -> jlptExamService.saveAnswer(ATTEMPT_ID, ATTEMPT_SESSION_ID, request()));

        verify(userJlptAttemptSessionRepository, never()).findById(any());
        verify(userJlptAttemptAnswerRepository, never()).save(any());
    }

    @Test
    void saveAnswerRejectsCompletedAttemptSession() {
        UserJlptAttempt attempt = stubInProgressAttempt();
        UserJlptAttemptSession attemptSession = UserJlptAttemptSession.builder()
                .id(ATTEMPT_SESSION_ID)
                .attempt(attempt)
                .status(JlptAttemptStatusEnum.COMPLETED)
                .build();
        when(userJlptAttemptSessionRepository.findByIdAndAttemptId(ATTEMPT_SESSION_ID, ATTEMPT_ID))
                .thenReturn(Optional.of(attemptSession));

        assertThrows(
                BadRequestException.class,
                () -> jlptExamService.saveAnswer(ATTEMPT_ID, ATTEMPT_SESSION_ID, request()));

        verify(userJlptAttemptAnswerRepository, never()).save(any());
    }

    @Test
    void saveAnswerRejectsQuestionOutsideAttemptSession() {
        UserJlptAttempt attempt = stubInProgressAttempt();
        stubInProgressAttemptSession(attempt);
        stubQuestionInSession(999L);

        assertThrows(
                BadRequestException.class,
                () -> jlptExamService.saveAnswer(ATTEMPT_ID, ATTEMPT_SESSION_ID, request()));

        verify(jlptExamAnswerRepository, never()).findById(any());
        verify(userJlptAttemptAnswerRepository, never()).save(any());
    }

    @Test
    void saveAnswerRejectsAnswerForAnotherQuestion() {
        UserJlptAttempt attempt = stubInProgressAttempt();
        stubInProgressAttemptSession(attempt);
        stubQuestionInSession(EXAM_SESSION_ID);
        JlptExamQuestion anotherQuestion = JlptExamQuestion.builder().id(999L).build();
        JlptExamAnswer selectedAnswer = JlptExamAnswer.builder()
                .id(ANSWER_ID)
                .jlptExamQuestion(anotherQuestion)
                .build();
        when(jlptExamAnswerRepository.findById(ANSWER_ID)).thenReturn(Optional.of(selectedAnswer));

        assertThrows(
                BadRequestException.class,
                () -> jlptExamService.saveAnswer(ATTEMPT_ID, ATTEMPT_SESSION_ID, request()));

        verify(userJlptAttemptAnswerRepository, never()).save(any());
    }

    @Test
    void submitAttemptCalculatesAndAggregatesResultsIncludingUnansweredQuestions() {
        UserJlptAttempt attempt = stubInProgressAttempt();
        attempt.setStartedAt(Instant.now().minusSeconds(300));

        JlptExamSession firstExamSession = JlptExamSession.builder()
                .id(EXAM_SESSION_ID)
                .name("Language knowledge")
                .build();
        JlptExamSession secondExamSession = JlptExamSession.builder()
                .id(41L)
                .name("Reading")
                .build();
        UserJlptAttemptSession firstAttemptSession = UserJlptAttemptSession.builder()
                .id(ATTEMPT_SESSION_ID)
                .attempt(attempt)
                .jlptExamSession(firstExamSession)
                .status(JlptAttemptStatusEnum.IN_PROGRESS)
                .startedAt(Instant.now().minusSeconds(200))
                .build();
        UserJlptAttemptSession secondAttemptSession = UserJlptAttemptSession.builder()
                .id(31L)
                .attempt(attempt)
                .jlptExamSession(secondExamSession)
                .status(JlptAttemptStatusEnum.IN_PROGRESS)
                .startedAt(Instant.now().minusSeconds(100))
                .build();
        when(userJlptAttemptSessionRepository
                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(ATTEMPT_ID))
                .thenReturn(List.of(firstAttemptSession, secondAttemptSession));

        JlptExamPart firstExamPart = JlptExamPart.builder()
                .id(100L)
                .name("Vocabulary")
                .build();
        JlptExamPart secondExamPart = JlptExamPart.builder()
                .id(101L)
                .name("Reading comprehension")
                .build();
        UserJlptAttemptPart firstAttemptPart = UserJlptAttemptPart.builder()
                .id(200L)
                .attemptSession(firstAttemptSession)
                .jlptExamPart(firstExamPart)
                .build();
        UserJlptAttemptPart secondAttemptPart = UserJlptAttemptPart.builder()
                .id(201L)
                .attemptSession(secondAttemptSession)
                .jlptExamPart(secondExamPart)
                .build();
        when(userJlptAttemptPartRepository
                .findByAttemptSession_IdOrderByJlptExamPart_SortOrderAsc(ATTEMPT_SESSION_ID))
                .thenReturn(List.of(firstAttemptPart));
        when(userJlptAttemptPartRepository
                .findByAttemptSession_IdOrderByJlptExamPart_SortOrderAsc(31L))
                .thenReturn(List.of(secondAttemptPart));

        JlptExamQuestion correctQuestion = JlptExamQuestion.builder()
                .id(QUESTION_ID)
                .points(new BigDecimal("2.00"))
                .build();
        JlptExamQuestion incorrectQuestion = JlptExamQuestion.builder()
                .id(51L)
                .points(new BigDecimal("3.00"))
                .build();
        JlptExamQuestion unansweredQuestion = JlptExamQuestion.builder()
                .id(52L)
                .points(new BigDecimal("4.00"))
                .build();
        when(jlptExamQuestionRepository.findByJlptExamPartIdOrderBySortOrderAsc(100L))
                .thenReturn(List.of(correctQuestion, incorrectQuestion));
        when(jlptExamQuestionRepository.findByJlptExamPartIdOrderBySortOrderAsc(101L))
                .thenReturn(List.of(unansweredQuestion));

        UserJlptAttemptAnswer correctAttemptAnswer = UserJlptAttemptAnswer.builder()
                .id(300L)
                .sessionAttempt(firstAttemptSession)
                .jlptExamQuestion(correctQuestion)
                .jlptExamAnswer(JlptExamAnswer.builder().id(ANSWER_ID).isCorrect(true).build())
                .isCorrect(false)
                .build();
        UserJlptAttemptAnswer incorrectAttemptAnswer = UserJlptAttemptAnswer.builder()
                .id(301L)
                .sessionAttempt(firstAttemptSession)
                .jlptExamQuestion(incorrectQuestion)
                .jlptExamAnswer(JlptExamAnswer.builder().id(61L).isCorrect(false).build())
                .isCorrect(true)
                .build();
        List<UserJlptAttemptAnswer> savedAnswers = List.of(
                correctAttemptAnswer,
                incorrectAttemptAnswer);
        when(userJlptAttemptAnswerRepository.findBySessionAttemptAttemptId(ATTEMPT_ID))
                .thenReturn(savedAnswers);

        SubmitJlptAttemptResponse response = jlptExamService.submitAttempt(ATTEMPT_ID);

        assertTrue(correctAttemptAnswer.getIsCorrect());
        assertFalse(incorrectAttemptAnswer.getIsCorrect());
        assertEquals(new BigDecimal("2.00"), firstAttemptPart.getScore());
        assertEquals(new BigDecimal("5.00"), firstAttemptPart.getMaxScore());
        assertEquals(1, firstAttemptPart.getCorrectCount());
        assertEquals(2, firstAttemptPart.getTotalQuestions());
        assertEquals(BigDecimal.ZERO, secondAttemptPart.getScore());
        assertEquals(new BigDecimal("4.00"), secondAttemptPart.getMaxScore());
        assertEquals(0, secondAttemptPart.getCorrectCount());
        assertEquals(1, secondAttemptPart.getTotalQuestions());

        assertEquals(JlptAttemptStatusEnum.COMPLETED, firstAttemptSession.getStatus());
        assertEquals(new BigDecimal("2.00"), firstAttemptSession.getScore());
        assertEquals(new BigDecimal("5.00"), firstAttemptSession.getMaxScore());
        assertEquals(1, firstAttemptSession.getCorrectCount());
        assertEquals(2, firstAttemptSession.getTotalQuestions());
        assertEquals(JlptAttemptStatusEnum.COMPLETED, secondAttemptSession.getStatus());
        assertTrue(firstAttemptSession.getDurationSeconds() >= 0);
        assertTrue(secondAttemptSession.getDurationSeconds() >= 0);

        assertEquals(JlptAttemptStatusEnum.COMPLETED, attempt.getStatus());
        assertEquals(new BigDecimal("2.00"), attempt.getTotalScore());
        assertTrue(attempt.getDurationSeconds() >= 0);
        assertEquals(new BigDecimal("2.00"), response.getTotalScore());
        assertEquals(new BigDecimal("9.00"), response.getMaxScore());
        assertEquals(1, response.getCorrectCount());
        assertEquals(3, response.getTotalQuestions());
        assertEquals(2, response.getSessions().size());
        assertThrows(
                BadRequestException.class,
                () -> jlptExamService.saveAnswer(ATTEMPT_ID, ATTEMPT_SESSION_ID, request()));

        verify(userJlptAttemptAnswerRepository).saveAll(savedAnswers);
        verify(userJlptAttemptPartRepository).saveAll(List.of(firstAttemptPart));
        verify(userJlptAttemptPartRepository).saveAll(List.of(secondAttemptPart));
        verify(userJlptAttemptSessionRepository)
                .saveAll(List.of(firstAttemptSession, secondAttemptSession));
        verify(userJlptAttemptRepository).save(attempt);
    }

    @Test
    void submitAttemptRejectsAttemptOwnedByAnotherUser() {
        stubCurrentUser();
        when(userJlptAttemptRepository.findByIdAndUser_Id(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThrows(
                ForbiddenException.class,
                () -> jlptExamService.submitAttempt(ATTEMPT_ID));

        verify(userJlptAttemptAnswerRepository, never()).findBySessionAttemptAttemptId(any());
        verify(userJlptAttemptRepository, never()).save(any());
    }

    @Test
    void submitAttemptRejectsAttemptThatIsNotInProgress() {
        stubAttempt(JlptAttemptStatusEnum.COMPLETED);

        assertThrows(
                BadRequestException.class,
                () -> jlptExamService.submitAttempt(ATTEMPT_ID));

        verify(userJlptAttemptAnswerRepository, never()).findBySessionAttemptAttemptId(any());
        verify(userJlptAttemptRepository, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = JlptLevelEnum.class, names = {"N5", "N4"})
    void getAttemptResultGroupsLanguageKnowledgeAndReadingForN5AndN4(JlptLevelEnum level) {
        stubCompletedResult(level);

        JlptAttemptResultResponse response = jlptExamService.getAttemptResult(ATTEMPT_ID);

        assertEquals("full", response.getMode());
        assertEquals(2, response.getScoringSections().size());
        assertScoringSection(
                response.getScoringSections().get(0),
                "Language Knowledge + Reading",
                "80.00",
                "120.00",
                "38");
        assertScoringSection(
                response.getScoringSections().get(1),
                "Listening",
                "20.00",
                "60.00",
                "19");
        assertEquals(expectedOverallPassScore(level), response.getOverallPassScore());
        assertEquals(3, response.getSessions().size());
        assertEquals("Vocabulary", response.getSessions().get(0).getParts().get(0).getPartName());
        assertTrue(response.getIsPassed());
        verify(userJlptAttemptAnswerRepository, never()).findBySessionAttemptAttemptId(any());
        verify(jlptExamQuestionRepository, never()).findByJlptExamPartIdOrderBySortOrderAsc(any());
    }

    @ParameterizedTest
    @EnumSource(value = JlptLevelEnum.class, names = {"N3", "N2", "N1"})
    void getAttemptResultKeepsSeparateScoringSectionsForN3N2AndN1(JlptLevelEnum level) {
        stubCompletedResult(level);

        JlptAttemptResultResponse response = jlptExamService.getAttemptResult(ATTEMPT_ID);

        assertEquals("full", response.getMode());
        assertEquals(3, response.getScoringSections().size());
        assertScoringSection(
                response.getScoringSections().get(0),
                "Language Knowledge",
                "40.00",
                "60.00",
                "19");
        assertScoringSection(
                response.getScoringSections().get(1),
                "Reading",
                "40.00",
                "60.00",
                "19");
        assertScoringSection(
                response.getScoringSections().get(2),
                "Listening",
                "20.00",
                "60.00",
                "19");
        assertEquals(expectedOverallPassScore(level), response.getOverallPassScore());
        assertTrue(response.getIsPassed());
    }

    @Test
    void getAttemptResultFailsN5WhenListeningIsBelowSectionMinimum() {
        List<UserJlptAttemptSession> sessions = stubCompletedResult(JlptLevelEnum.N5);
        sessions.get(2).setScore(new BigDecimal("18.00"));

        JlptAttemptResultResponse response = jlptExamService.getAttemptResult(ATTEMPT_ID);

        assertEquals(new BigDecimal("100.00"), response.getTotalScore());
        assertFalse(response.getScoringSections().get(1).getIsPassed());
        assertFalse(response.getIsPassed());
    }

    @Test
    void getAttemptResultForSessionModeReturnsOnlyPracticedSessionWithoutOverallEvaluation() {
        User user = stubCurrentUser();
        JlptExam exam = JlptExam.builder()
                .id(1L)
                .title("N3 practice exam")
                .jlptLevel(JlptLevelEnum.N3)
                .build();
        UserJlptAttempt attempt = UserJlptAttempt.builder()
                .id(ATTEMPT_ID)
                .user(user)
                .jlptExam(exam)
                .status(JlptAttemptStatusEnum.COMPLETED)
                .totalScore(new BigDecimal("25.00"))
                .startedAt(Instant.now().minusSeconds(180))
                .finishedAt(Instant.now())
                .durationSeconds(180)
                .build();
        when(userJlptAttemptRepository.findResultByIdAndUserId(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.of(attempt));

        UserJlptAttemptSession reading = resultSession(
                attempt,
                ATTEMPT_SESSION_ID,
                EXAM_SESSION_ID,
                "Reading",
                JlptSessionEnum.reading,
                "25.00",
                12);
        reading.setStartedAt(attempt.getStartedAt());
        reading.setFinishedAt(attempt.getFinishedAt());
        reading.setDurationSeconds(180);
        when(userJlptAttemptSessionRepository
                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(ATTEMPT_ID))
                .thenReturn(List.of(reading));

        UserJlptAttemptPart readingPart = resultPart(
                reading,
                101L,
                "Reading comprehension",
                "25.00",
                12);
        when(userJlptAttemptPartRepository.findResultPartsByAttemptId(ATTEMPT_ID))
                .thenReturn(List.of(readingPart));

        JlptAttemptResultResponse response = jlptExamService.getAttemptResult(ATTEMPT_ID);

        assertEquals("session", response.getMode());
        assertNull(response.getOverallPassScore());
        assertNull(response.getIsPassed());
        assertEquals(new BigDecimal("25.00"), response.getTotalScore());
        assertEquals(new BigDecimal("60.00"), response.getMaxScore());
        assertEquals(12, response.getCorrectCount());
        assertEquals(30, response.getTotalQuestions());
        assertEquals(1, response.getScoringSections().size());
        assertEquals("Reading", response.getScoringSections().get(0).getName());
        assertEquals(1, response.getSessions().size());
        assertEquals(JlptSessionEnum.reading, response.getSessions().get(0).getSessionType());
        assertEquals(180, response.getSessions().get(0).getDurationSeconds());
        assertEquals(1, response.getSessions().get(0).getParts().size());
        assertEquals("Reading comprehension", response.getSessions().get(0).getParts().get(0).getPartName());
    }

    @Test
    void getAttemptResultRejectsAttemptOwnedByAnotherUser() {
        stubCurrentUser();
        when(userJlptAttemptRepository.findResultByIdAndUserId(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThrows(
                ForbiddenException.class,
                () -> jlptExamService.getAttemptResult(ATTEMPT_ID));

        verify(userJlptAttemptSessionRepository, never())
                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(any());
    }

    @Test
    void getAttemptResultRejectsAttemptThatIsNotCompleted() {
        User user = stubCurrentUser();
        UserJlptAttempt attempt = UserJlptAttempt.builder()
                .id(ATTEMPT_ID)
                .user(user)
                .jlptExam(JlptExam.builder().id(1L).jlptLevel(JlptLevelEnum.N5).build())
                .status(JlptAttemptStatusEnum.IN_PROGRESS)
                .build();
        when(userJlptAttemptRepository.findResultByIdAndUserId(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.of(attempt));

        assertThrows(
                BadRequestException.class,
                () -> jlptExamService.getAttemptResult(ATTEMPT_ID));

        verify(userJlptAttemptSessionRepository, never())
                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(any());
    }

    @Test
    void getAttemptReviewReturnsCorrectAnswer() {
        JlptAttemptReviewResponse response = stubReviewResponse(ANSWER_ID, true);

        JlptAttemptReviewResponse.QuestionReview question = firstReviewQuestion(response);
        assertEquals(QUESTION_ID, question.getQuestionId());
        assertEquals(1, question.getQuestionOrder());
        assertEquals("Choose the correct answer", question.getQuestionText());
        assertEquals("Review passage", question.getPassageText());
        assertEquals(ANSWER_ID, question.getSelectedAnswerId());
        assertEquals(ANSWER_ID, question.getCorrectAnswerId());
        assertTrue(question.getIsCorrect());
        assertEquals("Correct because...", question.getExplanation());
        assertEquals(2, question.getAnswers().size());
        assertEquals("Correct answer", question.getAnswers().get(0).getAnswerText());
    }

    @Test
    void getAttemptReviewReturnsIncorrectAnswer() {
        JlptAttemptReviewResponse response = stubReviewResponse(61L, false);

        JlptAttemptReviewResponse.QuestionReview question = firstReviewQuestion(response);
        assertEquals(61L, question.getSelectedAnswerId());
        assertEquals(ANSWER_ID, question.getCorrectAnswerId());
        assertFalse(question.getIsCorrect());
    }

    @Test
    void getAttemptReviewKeepsUnansweredQuestionWithNullSelection() {
        JlptAttemptReviewResponse response = stubReviewResponse(null, false);

        JlptAttemptReviewResponse.QuestionReview question = firstReviewQuestion(response);
        assertNull(question.getSelectedAnswerId());
        assertEquals(ANSWER_ID, question.getCorrectAnswerId());
        assertFalse(question.getIsCorrect());
    }

    @Test
    void getAttemptReviewRejectsAttemptThatIsNotCompleted() {
        User user = stubCurrentUser();
        UserJlptAttempt attempt = UserJlptAttempt.builder()
                .id(ATTEMPT_ID)
                .user(user)
                .status(JlptAttemptStatusEnum.IN_PROGRESS)
                .build();
        when(userJlptAttemptRepository.findResultByIdAndUserId(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.of(attempt));

        assertThrows(
                BadRequestException.class,
                () -> jlptExamService.getAttemptReview(ATTEMPT_ID));

        verify(jlptExamQuestionRepository, never()).findReviewQuestionsByAttemptId(any());
    }

    @Test
    void getAttemptReviewRejectsAttemptOwnedByAnotherUser() {
        stubCurrentUser();
        when(userJlptAttemptRepository.findResultByIdAndUserId(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThrows(
                ForbiddenException.class,
                () -> jlptExamService.getAttemptReview(ATTEMPT_ID));

        verify(jlptExamQuestionRepository, never()).findReviewQuestionsByAttemptId(any());
    }

    @Test
    void getAttemptHistoryQueriesOnlyCurrentUser() {
        stubCurrentUser();
        JlptAttemptHistoryQuery query = historyQuery(0, 10);
        when(userJlptAttemptRepository.findHistoryByUserId(eq(USER_ID), any(Pageable.class)))
                .thenReturn(Page.empty());

        Page<JlptAttemptHistoryResponse> response = jlptExamService.getAttemptHistory(query);

        assertTrue(response.isEmpty());
        verify(userJlptAttemptRepository).findHistoryByUserId(eq(USER_ID), any(Pageable.class));
        verify(userJlptAttemptSessionRepository, never()).findHistorySessionsByAttemptIds(any());
    }

    @Test
    void getAttemptHistoryRequestsNewestAttemptsFirst() {
        stubCurrentUser();
        JlptAttemptHistoryQuery query = historyQuery(0, 10);
        UserJlptAttempt newerAttempt = historyAttempt(21L, Instant.parse("2026-09-23T03:00:00Z"), false);
        UserJlptAttempt olderAttempt = historyAttempt(20L, Instant.parse("2026-09-22T03:00:00Z"), false);
        when(userJlptAttemptRepository.findHistoryByUserId(eq(USER_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(newerAttempt, olderAttempt)));
        when(userJlptAttemptSessionRepository.findHistorySessionsByAttemptIds(List.of(21L, 20L)))
                .thenReturn(List.of());

        Page<JlptAttemptHistoryResponse> response = jlptExamService.getAttemptHistory(query);

        assertEquals(List.of(21L, 20L), response.getContent().stream()
                .map(JlptAttemptHistoryResponse::getAttemptId)
                .toList());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userJlptAttemptRepository).findHistoryByUserId(eq(USER_ID), pageableCaptor.capture());
        Sort sort = pageableCaptor.getValue().getSort();
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("startedAt").getDirection());
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("id").getDirection());
    }

    @Test
    void getAttemptHistoryPreservesPaginationMetadata() {
        stubCurrentUser();
        JlptAttemptHistoryQuery query = historyQuery(2, 3);
        UserJlptAttempt attempt = historyAttempt(ATTEMPT_ID, Instant.now(), false);
        PageRequest requestedPage = PageRequest.of(2, 3);
        when(userJlptAttemptRepository.findHistoryByUserId(eq(USER_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(attempt), requestedPage, 7));
        when(userJlptAttemptSessionRepository.findHistorySessionsByAttemptIds(List.of(ATTEMPT_ID)))
                .thenReturn(List.of());

        Page<JlptAttemptHistoryResponse> response = jlptExamService.getAttemptHistory(query);

        assertEquals(2, response.getNumber());
        assertEquals(3, response.getSize());
        assertEquals(7, response.getTotalElements());
        assertEquals(3, response.getTotalPages());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userJlptAttemptRepository).findHistoryByUserId(eq(USER_ID), pageableCaptor.capture());
        assertEquals(2, pageableCaptor.getValue().getPageNumber());
        assertEquals(3, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void getAttemptHistoryMapsFullModeSummary() {
        stubCurrentUser();
        JlptAttemptHistoryQuery query = historyQuery(0, 10);
        UserJlptAttempt attempt = historyAttempt(ATTEMPT_ID, Instant.now(), true);
        attempt.setTotalScore(new BigDecimal("100.00"));
        UserJlptAttemptSession languageKnowledge = historySession(
                attempt, ATTEMPT_SESSION_ID, EXAM_SESSION_ID, "Language Knowledge", "60.00", 20, 30);
        UserJlptAttemptSession listening = historySession(
                attempt, 31L, 41L, "Listening", "60.00", 15, 30);
        when(userJlptAttemptRepository.findHistoryByUserId(eq(USER_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(attempt)));
        when(userJlptAttemptSessionRepository.findHistorySessionsByAttemptIds(List.of(ATTEMPT_ID)))
                .thenReturn(List.of(languageKnowledge, listening));

        JlptAttemptHistoryResponse response = jlptExamService.getAttemptHistory(query).getContent().get(0);

        assertEquals("full", response.getMode());
        assertEquals(new BigDecimal("100.00"), response.getTotalScore());
        assertEquals(new BigDecimal("120.00"), response.getMaxScore());
        assertEquals(35, response.getCorrectCount());
        assertEquals(60, response.getTotalQuestions());
        assertTrue(response.getIsPassed());
        assertNull(response.getSessionId());
        assertNull(response.getSessionName());
    }

    @Test
    void getAttemptHistoryMapsSessionModeSummary() {
        stubCurrentUser();
        JlptAttemptHistoryQuery query = historyQuery(0, 10);
        UserJlptAttempt attempt = historyAttempt(ATTEMPT_ID, Instant.now(), true);
        attempt.setTotalScore(new BigDecimal("25.00"));
        UserJlptAttemptSession reading = historySession(
                attempt, ATTEMPT_SESSION_ID, EXAM_SESSION_ID, "Reading", "60.00", 12, 30);
        when(userJlptAttemptRepository.findHistoryByUserId(eq(USER_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(attempt)));
        when(userJlptAttemptSessionRepository.findHistorySessionsByAttemptIds(List.of(ATTEMPT_ID)))
                .thenReturn(List.of(reading));

        JlptAttemptHistoryResponse response = jlptExamService.getAttemptHistory(query).getContent().get(0);

        assertEquals("session", response.getMode());
        assertEquals(new BigDecimal("60.00"), response.getMaxScore());
        assertEquals(12, response.getCorrectCount());
        assertEquals(30, response.getTotalQuestions());
        assertNull(response.getIsPassed());
        assertEquals(EXAM_SESSION_ID, response.getSessionId());
        assertEquals("Reading", response.getSessionName());
    }

    private List<UserJlptAttemptSession> stubCompletedResult(JlptLevelEnum level) {
        User user = stubCurrentUser();
        JlptExam exam = JlptExam.builder()
                .id(1L)
                .title(level + " practice exam")
                .jlptLevel(level)
                .build();
        UserJlptAttempt attempt = UserJlptAttempt.builder()
                .id(ATTEMPT_ID)
                .user(user)
                .jlptExam(exam)
                .status(JlptAttemptStatusEnum.COMPLETED)
                .totalScore(new BigDecimal("100.00"))
                .startedAt(Instant.now().minusSeconds(600))
                .finishedAt(Instant.now())
                .durationSeconds(600)
                .build();
        when(userJlptAttemptRepository.findResultByIdAndUserId(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.of(attempt));

        UserJlptAttemptSession languageKnowledge = resultSession(
                attempt,
                ATTEMPT_SESSION_ID,
                EXAM_SESSION_ID,
                "Language Knowledge",
                JlptSessionEnum.language_knowledge,
                "40.00",
                20);
        UserJlptAttemptSession reading = resultSession(
                attempt,
                31L,
                41L,
                "Reading",
                JlptSessionEnum.reading,
                "40.00",
                20);
        UserJlptAttemptSession listening = resultSession(
                attempt,
                32L,
                42L,
                "Listening",
                JlptSessionEnum.listening,
                "20.00",
                10);
        List<UserJlptAttemptSession> sessions = List.of(languageKnowledge, reading, listening);
        when(userJlptAttemptSessionRepository
                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(ATTEMPT_ID))
                .thenReturn(sessions);

        List<UserJlptAttemptPart> parts = List.of(
                resultPart(languageKnowledge, 100L, "Vocabulary", "40.00", 20),
                resultPart(reading, 101L, "Reading comprehension", "40.00", 20),
                resultPart(listening, 102L, "Listening comprehension", "20.00", 10));
        when(userJlptAttemptPartRepository.findResultPartsByAttemptId(ATTEMPT_ID))
                .thenReturn(parts);

        return sessions;
    }

    private JlptAttemptHistoryQuery historyQuery(int page, int size) {
        JlptAttemptHistoryQuery query = new JlptAttemptHistoryQuery();
        query.setPage(page);
        query.setSize(size);
        return query;
    }

    private UserJlptAttempt historyAttempt(Long id, Instant startedAt, boolean isPassed) {
        return UserJlptAttempt.builder()
                .id(id)
                .jlptExam(JlptExam.builder()
                        .id(1L)
                        .title("N3 practice exam")
                        .jlptLevel(JlptLevelEnum.N3)
                        .build())
                .status(JlptAttemptStatusEnum.COMPLETED)
                .totalScore(BigDecimal.ZERO)
                .isPassed(isPassed)
                .startedAt(startedAt)
                .finishedAt(startedAt.plusSeconds(300))
                .durationSeconds(300)
                .build();
    }

    private UserJlptAttemptSession historySession(
            UserJlptAttempt attempt,
            Long attemptSessionId,
            Long examSessionId,
            String sessionName,
            String maxScore,
            int correctCount,
            int totalQuestions) {
        return UserJlptAttemptSession.builder()
                .id(attemptSessionId)
                .attempt(attempt)
                .jlptExamSession(JlptExamSession.builder()
                        .id(examSessionId)
                        .name(sessionName)
                        .build())
                .maxScore(new BigDecimal(maxScore))
                .correctCount(correctCount)
                .totalQuestions(totalQuestions)
                .build();
    }

    private JlptAttemptReviewResponse stubReviewResponse(
            Long selectedAnswerId,
            boolean savedIsCorrect) {
        User user = stubCurrentUser();
        JlptExam exam = JlptExam.builder()
                .id(1L)
                .title("N3 review exam")
                .jlptLevel(JlptLevelEnum.N3)
                .build();
        UserJlptAttempt attempt = UserJlptAttempt.builder()
                .id(ATTEMPT_ID)
                .user(user)
                .jlptExam(exam)
                .status(JlptAttemptStatusEnum.COMPLETED)
                .build();
        when(userJlptAttemptRepository.findResultByIdAndUserId(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.of(attempt));

        JlptExamSession examSession = JlptExamSession.builder()
                .id(EXAM_SESSION_ID)
                .name("Reading")
                .sessionType(JlptSessionEnum.reading)
                .sortOrder(1)
                .build();
        UserJlptAttemptSession attemptSession = UserJlptAttemptSession.builder()
                .id(ATTEMPT_SESSION_ID)
                .attempt(attempt)
                .jlptExamSession(examSession)
                .status(JlptAttemptStatusEnum.COMPLETED)
                .build();
        when(userJlptAttemptSessionRepository
                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(ATTEMPT_ID))
                .thenReturn(List.of(attemptSession));

        JlptExamPart examPart = JlptExamPart.builder()
                .id(100L)
                .jlptExamSession(examSession)
                .name("Reading comprehension")
                .sortOrder(1)
                .build();
        UserJlptAttemptPart attemptPart = UserJlptAttemptPart.builder()
                .id(200L)
                .attemptSession(attemptSession)
                .jlptExamPart(examPart)
                .build();
        when(userJlptAttemptPartRepository.findResultPartsByAttemptId(ATTEMPT_ID))
                .thenReturn(List.of(attemptPart));

        JlptExamQuestion question = JlptExamQuestion.builder()
                .id(QUESTION_ID)
                .jlptExamPart(examPart)
                .questionText("Choose the correct answer")
                .passageText("Review passage")
                .explanation("Correct because...")
                .sortOrder(1)
                .build();
        when(jlptExamQuestionRepository.findReviewQuestionsByAttemptId(ATTEMPT_ID))
                .thenReturn(List.of(question));

        JlptExamAnswer correctAnswer = JlptExamAnswer.builder()
                .id(ANSWER_ID)
                .jlptExamQuestion(question)
                .answerText("Correct answer")
                .isCorrect(true)
                .sortOrder(1)
                .build();
        JlptExamAnswer incorrectAnswer = JlptExamAnswer.builder()
                .id(61L)
                .jlptExamQuestion(question)
                .answerText("Incorrect answer")
                .isCorrect(false)
                .sortOrder(2)
                .build();
        when(jlptExamAnswerRepository.findReviewAnswersByQuestionIds(List.of(QUESTION_ID)))
                .thenReturn(List.of(correctAnswer, incorrectAnswer));

        if (selectedAnswerId == null) {
            when(userJlptAttemptAnswerRepository.findBySessionAttemptAttemptId(ATTEMPT_ID))
                    .thenReturn(List.of());
        } else {
            JlptExamAnswer selectedAnswer = selectedAnswerId.equals(ANSWER_ID)
                    ? correctAnswer
                    : incorrectAnswer;
            UserJlptAttemptAnswer attemptAnswer = UserJlptAttemptAnswer.builder()
                    .sessionAttempt(attemptSession)
                    .jlptExamQuestion(question)
                    .jlptExamAnswer(selectedAnswer)
                    .isCorrect(savedIsCorrect)
                    .build();
            when(userJlptAttemptAnswerRepository.findBySessionAttemptAttemptId(ATTEMPT_ID))
                    .thenReturn(List.of(attemptAnswer));
        }

        return jlptExamService.getAttemptReview(ATTEMPT_ID);
    }

    private JlptAttemptReviewResponse.QuestionReview firstReviewQuestion(
            JlptAttemptReviewResponse response) {
        assertEquals(1, response.getSessions().size());
        assertEquals(1, response.getSessions().get(0).getParts().size());
        assertEquals(1, response.getSessions().get(0).getParts().get(0).getQuestions().size());
        return response.getSessions().get(0).getParts().get(0).getQuestions().get(0);
    }

    private UserJlptAttemptSession resultSession(
            UserJlptAttempt attempt,
            Long attemptSessionId,
            Long examSessionId,
            String name,
            JlptSessionEnum sessionType,
            String score,
            int correctCount) {
        JlptExamSession examSession = JlptExamSession.builder()
                .id(examSessionId)
                .name(name)
                .sessionType(sessionType)
                .build();

        return UserJlptAttemptSession.builder()
                .id(attemptSessionId)
                .attempt(attempt)
                .jlptExamSession(examSession)
                .status(JlptAttemptStatusEnum.COMPLETED)
                .score(new BigDecimal(score))
                .maxScore(new BigDecimal("60.00"))
                .correctCount(correctCount)
                .totalQuestions(30)
                .build();
    }

    private UserJlptAttemptPart resultPart(
            UserJlptAttemptSession attemptSession,
            Long partId,
            String name,
            String score,
            int correctCount) {
        JlptExamPart examPart = JlptExamPart.builder()
                .id(partId)
                .name(name)
                .build();

        return UserJlptAttemptPart.builder()
                .id(partId + 100L)
                .attemptSession(attemptSession)
                .jlptExamPart(examPart)
                .score(new BigDecimal(score))
                .maxScore(new BigDecimal("60.00"))
                .correctCount(correctCount)
                .totalQuestions(30)
                .build();
    }

    private void assertScoringSection(
            JlptAttemptResultResponse.ScoringSectionResult section,
            String name,
            String score,
            String maxScore,
            String minimumPassScore) {
        assertEquals(name, section.getName());
        assertEquals(new BigDecimal(score), section.getScore());
        assertEquals(new BigDecimal(maxScore), section.getMaxScore());
        assertEquals(new BigDecimal(minimumPassScore), section.getMinimumPassScore());
        assertTrue(section.getIsPassed());
    }

    private BigDecimal expectedOverallPassScore(JlptLevelEnum level) {
        return switch (level) {
            case N1 -> BigDecimal.valueOf(100);
            case N2 -> BigDecimal.valueOf(90);
            case N3 -> BigDecimal.valueOf(95);
            case N4 -> BigDecimal.valueOf(90);
            case N5 -> BigDecimal.valueOf(80);
        };
    }

    private User stubCurrentUser() {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail(USER_EMAIL);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));
        return user;
    }

    private UserJlptAttempt stubAttempt(JlptAttemptStatusEnum status) {
        User user = stubCurrentUser();
        UserJlptAttempt attempt = UserJlptAttempt.builder()
                .id(ATTEMPT_ID)
                .user(user)
                .status(status)
                .build();
        when(userJlptAttemptRepository.findByIdAndUser_Id(ATTEMPT_ID, USER_ID))
                .thenReturn(Optional.of(attempt));
        return attempt;
    }

    private UserJlptAttempt stubInProgressAttempt() {
        return stubAttempt(JlptAttemptStatusEnum.IN_PROGRESS);
    }

    private UserJlptAttemptSession stubInProgressAttemptSession(UserJlptAttempt attempt) {
        JlptExamSession examSession = JlptExamSession.builder().id(EXAM_SESSION_ID).build();
        UserJlptAttemptSession attemptSession = UserJlptAttemptSession.builder()
                .id(ATTEMPT_SESSION_ID)
                .attempt(attempt)
                .jlptExamSession(examSession)
                .status(JlptAttemptStatusEnum.IN_PROGRESS)
                .build();
        when(userJlptAttemptSessionRepository.findByIdAndAttemptId(ATTEMPT_SESSION_ID, ATTEMPT_ID))
                .thenReturn(Optional.of(attemptSession));
        return attemptSession;
    }

    private JlptExamQuestion stubQuestionInSession(Long examSessionId) {
        JlptExamSession examSession = JlptExamSession.builder().id(examSessionId).build();
        JlptExamPart examPart = JlptExamPart.builder().jlptExamSession(examSession).build();
        JlptExamQuestion question = JlptExamQuestion.builder()
                .id(QUESTION_ID)
                .jlptExamPart(examPart)
                .build();
        when(jlptExamQuestionRepository.findById(QUESTION_ID)).thenReturn(Optional.of(question));
        return question;
    }

    private JlptExamAnswer stubAnswerForQuestion(JlptExamQuestion question) {
        JlptExamAnswer selectedAnswer = JlptExamAnswer.builder()
                .id(ANSWER_ID)
                .jlptExamQuestion(question)
                .build();
        when(jlptExamAnswerRepository.findById(ANSWER_ID)).thenReturn(Optional.of(selectedAnswer));
        return selectedAnswer;
    }

    private ReqSaveJlptAnswer request() {
        ReqSaveJlptAnswer request = new ReqSaveJlptAnswer();
        request.setQuestionId(QUESTION_ID);
        request.setAnswerId(ANSWER_ID);
        return request;
    }
}
