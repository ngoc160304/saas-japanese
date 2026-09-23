package com.mycompany.saas_japanese.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.UserJlptAttempt;
import com.mycompany.saas_japanese.domain.UserJlptAttemptAnswer;
import com.mycompany.saas_japanese.domain.query.JlptAttemptHistoryQuery;
import com.mycompany.saas_japanese.domain.query.JlptExamQuery;
import com.mycompany.saas_japanese.domain.request.ReqSaveJlptAnswer;
import com.mycompany.saas_japanese.domain.request.ReqStartJjptAttempt;
import com.mycompany.saas_japanese.domain.response.JlptAttemptHistoryResponse;
import com.mycompany.saas_japanese.domain.response.JlptAttemptReviewResponse;
import com.mycompany.saas_japanese.domain.response.JlptAttemptResultResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamPartResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamSessionResponse;
import com.mycompany.saas_japanese.domain.response.SaveJlptAnswerResponse;
import com.mycompany.saas_japanese.domain.response.StartJlptAttemptResponse;
import com.mycompany.saas_japanese.domain.response.SubmitJlptAttemptResponse;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptPartRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptAnswerRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptSessionRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.JlptExamService;
import com.mycompany.saas_japanese.service.mapper.JlptExamMapper;
import com.mycompany.saas_japanese.specification.JlptExamSpecs;
import com.mycompany.saas_japanese.util.SecurityUtil;
import com.mycompany.saas_japanese.util.constant.JlptAttemptStatusEnum;
import com.mycompany.saas_japanese.util.constant.JlptScoringRule;
import com.mycompany.saas_japanese.util.constant.JlptScoringRule.ScoringSectionRule;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.ForbiddenException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.UserJlptAttemptPart;
import com.mycompany.saas_japanese.domain.UserJlptAttemptSession;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JlptExamServiceImpl implements JlptExamService {
        private static final String FULL_ATTEMPT_MODE = "full";
        private static final String SESSION_ATTEMPT_MODE = "session";

        private final JlptExamRepository jlptExamRepository;
        private final JlptExamMapper jlptExamMapper;
        private final UserRepository userRepository;
        private final JlptExamSessionRepository jlptExamSessionRepository;
        private final JlptExamPartRepository jlptExamPartRepository;
        private final JlptExamAnswerRepository jlptExamAnswerRepository;
        private final JlptExamQuestionRepository jlptExamQuestionRepository;
        private final UserJlptAttemptSessionRepository userJlptAttemptSessionRepository;
        private final UserJlptAttemptPartRepository userJlptAttemptPartRepository;
        private final UserJlptAttemptAnswerRepository userJlptAttemptAnswerRepository;
        private final UserJlptAttemptRepository userJlptAttemptRepository;

        @Override
        @Transactional(Transactional.TxType.SUPPORTS)
        public JlptExamResponse fetchJlptExamById(
                        Long id) {
                JlptExam jlptExam = jlptExamRepository
                                .findByIdAndIsDeletedFalse(id)
                                .orElseThrow(
                                                () -> new NotFoundException(
                                                                "Exam không tồn tại"));
                return jlptExamMapper.toResponse(
                                jlptExam);
        }

        @Transactional(Transactional.TxType.SUPPORTS)
        public Page<JlptExamResponse> fetchAllJlptExam(JlptExamQuery query) {

                PredicateSpecification<JlptExam> spec = (root, builder) -> null;

                spec = spec.and(
                                JlptExamSpecs.hasTitle(query.getTitle()));

                spec = spec.and(
                                JlptExamSpecs.hasJlptLevel(query.getJlptLevel()));

                spec = spec.and(
                                JlptExamSpecs.hasSearch(query.getSearch()));
                PageRequest pageable = PageRequest.of(
                                query.getPage(),
                                query.getSize(),
                                buildSort(query));

                return jlptExamRepository.findBy(
                                spec,
                                q -> q.page(pageable)).map(jlptExamMapper::toResponse);
        }

        @Override
        @Transactional(Transactional.TxType.SUPPORTS)
        public JlptExamDetailResponse fetchJlptExamDetail(Long id) {

                JlptExam jlptExam = jlptExamRepository
                                .findByIdAndIsDeletedFalse(id)
                                .orElseThrow(
                                                () -> new NotFoundException(
                                                                "Exam không tồn tại"));

                List<JlptExamSessionResponse> sessions = jlptExam.getSessions()
                                .stream()
                                .map(session -> {

                                        List<JlptExamPartResponse> parts = session.getParts()
                                                        .stream()
                                                        .map(jlptExamMapper::toPartResponse)
                                                        .toList();

                                        int questionCount = parts.stream()
                                                        .mapToInt(JlptExamPartResponse::getQuestionCount)
                                                        .sum();

                                        return jlptExamMapper.toSessionResponse(
                                                        session,
                                                        parts,
                                                        questionCount);
                                })
                                .toList();

                return jlptExamMapper.toDetailResponse(
                                jlptExam,
                                sessions);
        }

        @Override
        @Transactional(Transactional.TxType.SUPPORTS)
        public JlptExamSessionResponse fetchJlptExamSession(
                        Long examId,
                        Long sessionId) {

                JlptExam exam = jlptExamRepository
                                .findByIdAndIsDeletedFalse(examId)
                                .orElseThrow(
                                                () -> new NotFoundException(
                                                                "Exam không tồn tại"));

                JlptExamSession session = exam.getSessions()
                                .stream()
                                .filter(item -> item.getId().equals(sessionId))
                                .findFirst()
                                .orElseThrow(
                                                () -> new NotFoundException(
                                                                "Session không tồn tại"));

                List<JlptExamPartResponse> parts = session.getParts()
                                .stream()
                                .map(jlptExamMapper::toPartResponse)
                                .toList();

                int questionCount = parts.stream()
                                .mapToInt(JlptExamPartResponse::getQuestionCount)
                                .sum();

                return jlptExamMapper.toSessionResponse(
                                session,
                                parts,
                                questionCount);
        }

        @Override
        @Transactional
        public StartJlptAttemptResponse startAttempt(
                        Long examId,
                        ReqStartJjptAttempt request) {

                String mode = request.getMode();

                if (!"full".equals(mode) && !"session".equals(mode)) {
                        throw new IllegalArgumentException(
                                        "Mode must be 'full' or 'session'");
                }

                if ("session".equals(mode)
                                && request.getSessionId() == null) {
                        throw new IllegalArgumentException(
                                        "sessionId is required when mode = session");
                }

                if ("full".equals(mode)
                                && request.getSessionId() != null) {
                        throw new IllegalArgumentException(
                                        "sessionId must be null when mode = full");
                }

                JlptExam exam = jlptExamRepository.findById(examId)
                                .orElseThrow(() -> new RuntimeException("JLPT exam not found"));

                User user = userRepository.findById(request.getUserId())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                List<JlptExamSession> sessions;

                if ("full".equals(mode)) {

                        sessions = jlptExamSessionRepository
                                        .findByJlptExam_IdOrderBySortOrderAsc(examId);

                } else {

                        JlptExamSession session = jlptExamSessionRepository
                                        .findById(request.getSessionId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "JLPT exam session not found"));

                        if (!session.getJlptExam().getId().equals(examId)) {
                                throw new IllegalArgumentException(
                                                "Session does not belong to this exam");
                        }

                        sessions = List.of(session);
                }

                if (sessions.isEmpty()) {
                        throw new RuntimeException(
                                        "This exam has no sessions");
                }

                UserJlptAttempt attempt = UserJlptAttempt.builder()
                                .user(user)
                                .jlptExam(exam)
                                .startedAt(Instant.now())
                                .build();

                attempt = userJlptAttemptRepository.save(attempt);

                List<StartJlptAttemptResponse.AttemptSessionResponse> sessionResponses = new ArrayList<>();

                for (JlptExamSession examSession : sessions) {

                        UserJlptAttemptSession attemptSession = UserJlptAttemptSession.builder()
                                        .attempt(attempt)
                                        .jlptExamSession(examSession)
                                        .startedAt(Instant.now())
                                        .build();

                        attemptSession = userJlptAttemptSessionRepository
                                        .save(attemptSession);

                        List<JlptExamPart> parts = jlptExamPartRepository
                                        .findByJlptExamSession_IdOrderBySortOrderAsc(
                                                        examSession.getId());

                        List<StartJlptAttemptResponse.AttemptPartResponse> partResponses = new ArrayList<>();

                        for (JlptExamPart examPart : parts) {

                                UserJlptAttemptPart attemptPart = UserJlptAttemptPart.builder()
                                                .attemptSession(attemptSession)
                                                .jlptExamPart(examPart)
                                                .build();

                                attemptPart = userJlptAttemptPartRepository
                                                .save(attemptPart);

                                List<JlptExamQuestion> questions = jlptExamQuestionRepository
                                                .findByJlptExamPartIdOrderBySortOrderAsc(
                                                                examPart.getId());

                                List<StartJlptAttemptResponse.QuestionResponse> questionResponses = new ArrayList<>();

                                for (JlptExamQuestion question : questions) {

                                        List<JlptExamAnswer> answers = jlptExamAnswerRepository
                                                        .findByJlptExamQuestionIdOrderBySortOrderAsc(
                                                                        question.getId());

                                        List<StartJlptAttemptResponse.AnswerResponse> answerResponses = answers.stream()
                                                        .map(answer -> StartJlptAttemptResponse.AnswerResponse
                                                                        .builder()
                                                                        .answerId(answer.getId())
                                                                        .answerText(answer.getAnswerText())
                                                                        .build())
                                                        .toList();

                                        questionResponses.add(
                                                        StartJlptAttemptResponse.QuestionResponse
                                                                        .builder()
                                                                        .questionId(question.getId())
                                                                        .questionOrder(
                                                                                        question.getSortOrder())
                                                                        .questionText(
                                                                                        question.getQuestionText())
                                                                        .answers(answerResponses)
                                                                        .build());
                                }

                                partResponses.add(
                                                StartJlptAttemptResponse.AttemptPartResponse
                                                                .builder()
                                                                .attemptPartId(attemptPart.getId())
                                                                .partId(examPart.getId())
                                                                .partName(examPart.getName())
                                                                .partOrder(examPart.getSortOrder())
                                                                .questions(questionResponses)
                                                                .build());
                        }

                        sessionResponses.add(
                                        StartJlptAttemptResponse.AttemptSessionResponse
                                                        .builder()
                                                        .attemptSessionId(
                                                                        attemptSession.getId())
                                                        .sessionId(examSession.getId())
                                                        .sessionTitle(
                                                                        examSession.getName())
                                                        .sessionOrder(
                                                                        examSession.getSortOrder())
                                                        .parts(partResponses)
                                                        .build());
                }

                return StartJlptAttemptResponse
                                .builder()
                                .attemptId(attempt.getId())
                                .examId(exam.getId())
                                .examTitle(exam.getTitle())
                                .mode(mode)
                                .startedAt(attempt.getStartedAt())
                                .sessions(sessionResponses)
                                .build();
        }

        @Override
        @Transactional
        public SaveJlptAnswerResponse saveAnswer(
                        Long attemptId,
                        Long attemptSessionId,
                        ReqSaveJlptAnswer request) {
                User currentUser = getCurrentUser();
                UserJlptAttempt attempt = userJlptAttemptRepository
                                .findByIdAndUser_Id(attemptId, currentUser.getId())
                                .orElseThrow(() -> new ForbiddenException(
                                                "JLPT attempt does not belong to the current user"));

                if (attempt.getStatus() != JlptAttemptStatusEnum.IN_PROGRESS) {
                        throw new BadRequestException("JLPT attempt is not in progress");
                }

                UserJlptAttemptSession attemptSession = userJlptAttemptSessionRepository
                                .findByIdAndAttemptId(attemptSessionId, attemptId)
                                .orElseThrow(() -> new NotFoundException(
                                                "JLPT attempt session not found"));

                if (attemptSession.getStatus() != JlptAttemptStatusEnum.IN_PROGRESS) {
                        throw new BadRequestException("JLPT attempt session is not in progress");
                }

                JlptExamQuestion question = jlptExamQuestionRepository
                                .findById(request.getQuestionId())
                                .orElseThrow(() -> new NotFoundException(
                                                "JLPT exam question not found"));

                Long questionSessionId = question.getJlptExamPart()
                                .getJlptExamSession()
                                .getId();
                Long attemptExamSessionId = attemptSession.getJlptExamSession().getId();

                if (!questionSessionId.equals(attemptExamSessionId)) {
                        throw new BadRequestException(
                                        "Question does not belong to the JLPT attempt session");
                }

                JlptExamAnswer selectedAnswer = jlptExamAnswerRepository
                                .findById(request.getAnswerId())
                                .orElseThrow(() -> new NotFoundException(
                                                "JLPT exam answer not found"));

                if (!selectedAnswer.getJlptExamQuestion().getId().equals(question.getId())) {
                        throw new BadRequestException(
                                        "Answer does not belong to the JLPT exam question");
                }

                UserJlptAttemptAnswer attemptAnswer = userJlptAttemptAnswerRepository
                                .findBySessionAttempt_IdAndJlptExamQuestion_Id(
                                                attemptSessionId,
                                                question.getId())
                                .orElseGet(() -> UserJlptAttemptAnswer.builder()
                                                .sessionAttempt(attemptSession)
                                                .jlptExamQuestion(question)
                                                .isCorrect(false)
                                                .build());

                attemptAnswer.setJlptExamAnswer(selectedAnswer);
                attemptAnswer.setAnsweredAt(Instant.now());
                attemptAnswer = userJlptAttemptAnswerRepository.save(attemptAnswer);

                return SaveJlptAnswerResponse.builder()
                                .attemptAnswerId(attemptAnswer.getId())
                                .attemptId(attempt.getId())
                                .attemptSessionId(attemptSession.getId())
                                .questionId(question.getId())
                                .answerId(selectedAnswer.getId())
                                .answeredAt(attemptAnswer.getAnsweredAt())
                                .build();
        }

        @Override
        @Transactional
        public SubmitJlptAttemptResponse submitAttempt(Long attemptId) {
                User currentUser = getCurrentUser();
                UserJlptAttempt attempt = userJlptAttemptRepository
                                .findByIdAndUser_Id(attemptId, currentUser.getId())
                                .orElseThrow(() -> new ForbiddenException(
                                                "JLPT attempt does not belong to the current user"));

                if (attempt.getStatus() != JlptAttemptStatusEnum.IN_PROGRESS) {
                        throw new BadRequestException("JLPT attempt is not in progress");
                }

                List<UserJlptAttemptAnswer> savedAnswers = userJlptAttemptAnswerRepository
                                .findBySessionAttemptAttemptId(attemptId);
                Map<Long, UserJlptAttemptAnswer> answersByQuestionId = new HashMap<>();

                for (UserJlptAttemptAnswer savedAnswer : savedAnswers) {
                        JlptExamAnswer selectedAnswer = savedAnswer.getJlptExamAnswer();
                        boolean isCorrect = selectedAnswer != null
                                        && Boolean.TRUE.equals(selectedAnswer.getIsCorrect());
                        savedAnswer.setIsCorrect(isCorrect);
                        answersByQuestionId.put(savedAnswer.getJlptExamQuestion().getId(), savedAnswer);
                }

                List<UserJlptAttemptSession> attemptSessions = userJlptAttemptSessionRepository
                                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(attemptId);
                List<SubmitJlptAttemptResponse.SessionResult> sessionResults = new ArrayList<>();
                BigDecimal attemptScore = BigDecimal.ZERO;
                BigDecimal attemptMaxScore = BigDecimal.ZERO;
                int attemptCorrectCount = 0;
                int attemptTotalQuestions = 0;
                Instant finishedAt = Instant.now();

                for (UserJlptAttemptSession attemptSession : attemptSessions) {
                        List<UserJlptAttemptPart> attemptParts = userJlptAttemptPartRepository
                                        .findByAttemptSession_IdOrderByJlptExamPart_SortOrderAsc(
                                                        attemptSession.getId());
                        List<SubmitJlptAttemptResponse.PartResult> partResults = new ArrayList<>();
                        BigDecimal sessionScore = BigDecimal.ZERO;
                        BigDecimal sessionMaxScore = BigDecimal.ZERO;
                        int sessionCorrectCount = 0;
                        int sessionTotalQuestions = 0;

                        for (UserJlptAttemptPart attemptPart : attemptParts) {
                                List<JlptExamQuestion> questions = jlptExamQuestionRepository
                                                .findByJlptExamPartIdOrderBySortOrderAsc(
                                                                attemptPart.getJlptExamPart().getId());
                                BigDecimal partScore = BigDecimal.ZERO;
                                BigDecimal partMaxScore = BigDecimal.ZERO;
                                int partCorrectCount = 0;

                                for (JlptExamQuestion question : questions) {
                                        BigDecimal points = question.getPoints();
                                        partMaxScore = partMaxScore.add(points);

                                        UserJlptAttemptAnswer savedAnswer = answersByQuestionId
                                                        .get(question.getId());
                                        if (savedAnswer != null && Boolean.TRUE.equals(savedAnswer.getIsCorrect())) {
                                                partCorrectCount++;
                                                partScore = partScore.add(points);
                                        }
                                }

                                int partTotalQuestions = questions.size();
                                attemptPart.setScore(partScore);
                                attemptPart.setMaxScore(partMaxScore);
                                attemptPart.setCorrectCount(partCorrectCount);
                                attemptPart.setTotalQuestions(partTotalQuestions);

                                sessionScore = sessionScore.add(partScore);
                                sessionMaxScore = sessionMaxScore.add(partMaxScore);
                                sessionCorrectCount += partCorrectCount;
                                sessionTotalQuestions += partTotalQuestions;

                                partResults.add(SubmitJlptAttemptResponse.PartResult.builder()
                                                .attemptPartId(attemptPart.getId())
                                                .partId(attemptPart.getJlptExamPart().getId())
                                                .partName(attemptPart.getJlptExamPart().getName())
                                                .score(partScore)
                                                .maxScore(partMaxScore)
                                                .correctCount(partCorrectCount)
                                                .totalQuestions(partTotalQuestions)
                                                .build());
                        }

                        attemptSession.setScore(sessionScore);
                        attemptSession.setMaxScore(sessionMaxScore);
                        attemptSession.setCorrectCount(sessionCorrectCount);
                        attemptSession.setTotalQuestions(sessionTotalQuestions);
                        attemptSession.setStatus(JlptAttemptStatusEnum.COMPLETED);
                        attemptSession.setFinishedAt(finishedAt);
                        attemptSession.setDurationSeconds(
                                        calculateDurationSeconds(attemptSession.getStartedAt(), finishedAt));

                        userJlptAttemptPartRepository.saveAll(attemptParts);

                        attemptScore = attemptScore.add(sessionScore);
                        attemptMaxScore = attemptMaxScore.add(sessionMaxScore);
                        attemptCorrectCount += sessionCorrectCount;
                        attemptTotalQuestions += sessionTotalQuestions;

                        sessionResults.add(SubmitJlptAttemptResponse.SessionResult.builder()
                                        .attemptSessionId(attemptSession.getId())
                                        .sessionId(attemptSession.getJlptExamSession().getId())
                                        .sessionName(attemptSession.getJlptExamSession().getName())
                                        .status(attemptSession.getStatus())
                                        .score(sessionScore)
                                        .maxScore(sessionMaxScore)
                                        .correctCount(sessionCorrectCount)
                                        .totalQuestions(sessionTotalQuestions)
                                        .startedAt(attemptSession.getStartedAt())
                                        .finishedAt(attemptSession.getFinishedAt())
                                        .durationSeconds(attemptSession.getDurationSeconds())
                                        .parts(partResults)
                                        .build());
                }

                attempt.setTotalScore(attemptScore);
                attempt.setStatus(JlptAttemptStatusEnum.COMPLETED);
                attempt.setFinishedAt(finishedAt);
                attempt.setDurationSeconds(calculateDurationSeconds(attempt.getStartedAt(), finishedAt));

                userJlptAttemptAnswerRepository.saveAll(savedAnswers);
                userJlptAttemptSessionRepository.saveAll(attemptSessions);
                userJlptAttemptRepository.save(attempt);

                return SubmitJlptAttemptResponse.builder()
                                .attemptId(attempt.getId())
                                .status(attempt.getStatus())
                                .totalScore(attemptScore)
                                .maxScore(attemptMaxScore)
                                .correctCount(attemptCorrectCount)
                                .totalQuestions(attemptTotalQuestions)
                                .startedAt(attempt.getStartedAt())
                                .finishedAt(attempt.getFinishedAt())
                                .durationSeconds(attempt.getDurationSeconds())
                                .sessions(sessionResults)
                                .build();
        }

        @Override
        @Transactional(Transactional.TxType.SUPPORTS)
        public JlptAttemptResultResponse getAttemptResult(Long attemptId) {
                User currentUser = getCurrentUser();
                UserJlptAttempt attempt = userJlptAttemptRepository
                                .findResultByIdAndUserId(attemptId, currentUser.getId())
                                .orElseThrow(() -> new ForbiddenException(
                                                "JLPT attempt does not belong to the current user"));

                if (attempt.getStatus() != JlptAttemptStatusEnum.COMPLETED) {
                        throw new BadRequestException("JLPT attempt is not completed");
                }

                List<UserJlptAttemptSession> attemptSessions = userJlptAttemptSessionRepository
                                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(attemptId);
                List<UserJlptAttemptPart> attemptParts = userJlptAttemptPartRepository
                                .findResultPartsByAttemptId(attemptId);
                Map<Long, List<JlptAttemptResultResponse.PartResult>> partsByAttemptSessionId = buildResultParts(
                                attemptParts);

                List<JlptAttemptResultResponse.SessionResult> sessionResults = attemptSessions.stream()
                                .map(attemptSession -> toResultSession(
                                                attemptSession,
                                                partsByAttemptSessionId.getOrDefault(
                                                                attemptSession.getId(),
                                                                List.of())))
                                .toList();

                String mode = determineAttemptMode(attemptSessions);
                boolean isFullAttempt = FULL_ATTEMPT_MODE.equals(mode);
                JlptScoringRule scoringRule = JlptScoringRule.forLevel(
                                attempt.getJlptExam().getJlptLevel());
                List<JlptAttemptResultResponse.ScoringSectionResult> scoringSectionResults = scoringRule
                                .getScoringSections()
                                .stream()
                                .filter(sectionRule -> isFullAttempt
                                                || includesAttemptedSession(sectionRule, attemptSessions))
                                .map(sectionRule -> toScoringSectionResult(sectionRule, attemptSessions))
                                .toList();

                BigDecimal maxScore = attemptSessions.stream()
                                .map(UserJlptAttemptSession::getMaxScore)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                int correctCount = attemptSessions.stream()
                                .mapToInt(UserJlptAttemptSession::getCorrectCount)
                                .sum();
                int totalQuestions = attemptSessions.stream()
                                .mapToInt(UserJlptAttemptSession::getTotalQuestions)
                                .sum();
                Boolean isPassed = null;
                if (isFullAttempt) {
                        isPassed = attempt.getTotalScore().compareTo(scoringRule.getOverallPassScore()) >= 0
                                        && scoringSectionResults.stream()
                                                        .allMatch(section -> Boolean.TRUE.equals(
                                                                        section.getIsPassed()));
                }

                return JlptAttemptResultResponse.builder()
                                .attemptId(attempt.getId())
                                .examId(attempt.getJlptExam().getId())
                                .examTitle(attempt.getJlptExam().getTitle())
                                .jlptLevel(attempt.getJlptExam().getJlptLevel())
                                .status(attempt.getStatus())
                                .mode(mode)
                                .totalScore(attempt.getTotalScore())
                                .maxScore(maxScore)
                                .overallPassScore(isFullAttempt
                                                ? scoringRule.getOverallPassScore()
                                                : null)
                                .correctCount(correctCount)
                                .totalQuestions(totalQuestions)
                                .isPassed(isPassed)
                                .startedAt(attempt.getStartedAt())
                                .finishedAt(attempt.getFinishedAt())
                                .durationSeconds(attempt.getDurationSeconds())
                                .scoringSections(scoringSectionResults)
                                .sessions(sessionResults)
                                .build();
        }

        @Override
        @Transactional(Transactional.TxType.SUPPORTS)
        public JlptAttemptReviewResponse getAttemptReview(Long attemptId) {
                User currentUser = getCurrentUser();
                UserJlptAttempt attempt = userJlptAttemptRepository
                                .findResultByIdAndUserId(attemptId, currentUser.getId())
                                .orElseThrow(() -> new ForbiddenException(
                                                "JLPT attempt does not belong to the current user"));

                if (attempt.getStatus() != JlptAttemptStatusEnum.COMPLETED) {
                        throw new BadRequestException("JLPT attempt is not completed");
                }

                List<UserJlptAttemptSession> attemptSessions = userJlptAttemptSessionRepository
                                .findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(attemptId);
                List<UserJlptAttemptPart> attemptParts = userJlptAttemptPartRepository
                                .findResultPartsByAttemptId(attemptId);
                List<JlptExamQuestion> questions = jlptExamQuestionRepository
                                .findReviewQuestionsByAttemptId(attemptId);
                List<Long> questionIds = questions.stream()
                                .map(JlptExamQuestion::getId)
                                .toList();
                List<JlptExamAnswer> answerOptions = questionIds.isEmpty()
                                ? List.of()
                                : jlptExamAnswerRepository.findReviewAnswersByQuestionIds(questionIds);
                List<UserJlptAttemptAnswer> savedAnswers = userJlptAttemptAnswerRepository
                                .findBySessionAttemptAttemptId(attemptId);

                Map<Long, UserJlptAttemptAnswer> savedAnswersByQuestionId = new HashMap<>();
                for (UserJlptAttemptAnswer savedAnswer : savedAnswers) {
                        savedAnswersByQuestionId.put(savedAnswer.getJlptExamQuestion().getId(), savedAnswer);
                }

                Map<Long, List<JlptExamAnswer>> answersByQuestionId = new HashMap<>();
                for (JlptExamAnswer answerOption : answerOptions) {
                        answersByQuestionId
                                        .computeIfAbsent(
                                                        answerOption.getJlptExamQuestion().getId(),
                                                        ignored -> new ArrayList<>())
                                        .add(answerOption);
                }

                Map<Long, List<JlptAttemptReviewResponse.QuestionReview>> questionsByPartId = new HashMap<>();
                for (JlptExamQuestion question : questions) {
                        List<JlptExamAnswer> questionAnswers = answersByQuestionId.getOrDefault(
                                        question.getId(),
                                        List.of());
                        UserJlptAttemptAnswer savedAnswer = savedAnswersByQuestionId.get(question.getId());
                        JlptAttemptReviewResponse.QuestionReview questionReview = toQuestionReview(
                                        question,
                                        questionAnswers,
                                        savedAnswer);

                        questionsByPartId
                                        .computeIfAbsent(
                                                        question.getJlptExamPart().getId(),
                                                        ignored -> new ArrayList<>())
                                        .add(questionReview);
                }

                Map<Long, List<JlptAttemptReviewResponse.PartReview>> partsByAttemptSessionId = new HashMap<>();
                for (UserJlptAttemptPart attemptPart : attemptParts) {
                        JlptExamPart examPart = attemptPart.getJlptExamPart();
                        JlptAttemptReviewResponse.PartReview partReview = JlptAttemptReviewResponse.PartReview
                                        .builder()
                                        .attemptPartId(attemptPart.getId())
                                        .partId(examPart.getId())
                                        .partName(examPart.getName())
                                        .partOrder(examPart.getSortOrder())
                                        .questions(questionsByPartId.getOrDefault(examPart.getId(), List.of()))
                                        .build();

                        partsByAttemptSessionId
                                        .computeIfAbsent(
                                                        attemptPart.getAttemptSession().getId(),
                                                        ignored -> new ArrayList<>())
                                        .add(partReview);
                }

                List<JlptAttemptReviewResponse.SessionReview> sessionReviews = attemptSessions.stream()
                                .map(attemptSession -> JlptAttemptReviewResponse.SessionReview.builder()
                                                .attemptSessionId(attemptSession.getId())
                                                .sessionId(attemptSession.getJlptExamSession().getId())
                                                .sessionName(attemptSession.getJlptExamSession().getName())
                                                .sessionType(attemptSession.getJlptExamSession().getSessionType())
                                                .sessionOrder(attemptSession.getJlptExamSession().getSortOrder())
                                                .parts(partsByAttemptSessionId.getOrDefault(
                                                                attemptSession.getId(),
                                                                List.of()))
                                                .build())
                                .toList();

                return JlptAttemptReviewResponse.builder()
                                .attemptId(attempt.getId())
                                .examId(attempt.getJlptExam().getId())
                                .examTitle(attempt.getJlptExam().getTitle())
                                .jlptLevel(attempt.getJlptExam().getJlptLevel())
                                .status(attempt.getStatus())
                                .sessions(sessionReviews)
                                .build();
        }

        private JlptAttemptReviewResponse.QuestionReview toQuestionReview(
                        JlptExamQuestion question,
                        List<JlptExamAnswer> answerOptions,
                        UserJlptAttemptAnswer savedAnswer) {
                Long selectedAnswerId = savedAnswer == null || savedAnswer.getJlptExamAnswer() == null
                                ? null
                                : savedAnswer.getJlptExamAnswer().getId();
                Long correctAnswerId = answerOptions.stream()
                                .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect()))
                                .map(JlptExamAnswer::getId)
                                .findFirst()
                                .orElseThrow(() -> new IllegalStateException(
                                                "JLPT question has no correct answer: " + question.getId()));
                List<JlptAttemptReviewResponse.AnswerReview> answers = answerOptions.stream()
                                .map(answer -> JlptAttemptReviewResponse.AnswerReview.builder()
                                                .answerId(answer.getId())
                                                .answerText(answer.getAnswerText())
                                                .build())
                                .toList();

                return JlptAttemptReviewResponse.QuestionReview.builder()
                                .questionId(question.getId())
                                .questionOrder(question.getSortOrder())
                                .questionText(question.getQuestionText())
                                .passageText(question.getPassageText())
                                .selectedAnswerId(selectedAnswerId)
                                .correctAnswerId(correctAnswerId)
                                .isCorrect(savedAnswer != null
                                                && Boolean.TRUE.equals(savedAnswer.getIsCorrect()))
                                .answers(answers)
                                .explanation(question.getExplanation())
                                .build();
        }

        @Override
        @Transactional(Transactional.TxType.SUPPORTS)
        public Page<JlptAttemptHistoryResponse> getAttemptHistory(JlptAttemptHistoryQuery query) {
                User currentUser = getCurrentUser();
                PageRequest pageable = PageRequest.of(
                                query.getPage(),
                                query.getSize(),
                                Sort.by(Sort.Direction.DESC, "startedAt")
                                                .and(Sort.by(Sort.Direction.DESC, "id")));
                Page<UserJlptAttempt> attempts = userJlptAttemptRepository.findHistoryByUserId(
                                currentUser.getId(),
                                pageable);
                List<Long> attemptIds = attempts.getContent().stream()
                                .map(UserJlptAttempt::getId)
                                .toList();
                List<UserJlptAttemptSession> attemptSessions = attemptIds.isEmpty()
                                ? List.of()
                                : userJlptAttemptSessionRepository.findHistorySessionsByAttemptIds(attemptIds);
                Map<Long, List<UserJlptAttemptSession>> sessionsByAttemptId = new HashMap<>();

                for (UserJlptAttemptSession attemptSession : attemptSessions) {
                        sessionsByAttemptId
                                        .computeIfAbsent(
                                                        attemptSession.getAttempt().getId(),
                                                        ignored -> new ArrayList<>())
                                        .add(attemptSession);
                }

                return attempts.map(attempt -> toAttemptHistoryResponse(
                                attempt,
                                sessionsByAttemptId.getOrDefault(attempt.getId(), List.of())));
        }

        private JlptAttemptHistoryResponse toAttemptHistoryResponse(
                        UserJlptAttempt attempt,
                        List<UserJlptAttemptSession> attemptSessions) {
                String mode = determineAttemptMode(attemptSessions);
                boolean isFullAttempt = FULL_ATTEMPT_MODE.equals(mode);
                UserJlptAttemptSession practicedSession = SESSION_ATTEMPT_MODE.equals(mode)
                                ? attemptSessions.get(0)
                                : null;
                BigDecimal maxScore = attemptSessions.stream()
                                .map(UserJlptAttemptSession::getMaxScore)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                int correctCount = attemptSessions.stream()
                                .mapToInt(UserJlptAttemptSession::getCorrectCount)
                                .sum();
                int totalQuestions = attemptSessions.stream()
                                .mapToInt(UserJlptAttemptSession::getTotalQuestions)
                                .sum();

                return JlptAttemptHistoryResponse.builder()
                                .attemptId(attempt.getId())
                                .examId(attempt.getJlptExam().getId())
                                .examTitle(attempt.getJlptExam().getTitle())
                                .jlptLevel(attempt.getJlptExam().getJlptLevel())
                                .mode(mode)
                                .status(attempt.getStatus())
                                .totalScore(attempt.getTotalScore())
                                .maxScore(maxScore)
                                .correctCount(correctCount)
                                .totalQuestions(totalQuestions)
                                .isPassed(isFullAttempt
                                                && attempt.getStatus() == JlptAttemptStatusEnum.COMPLETED
                                                                ? attempt.getIsPassed()
                                                                : null)
                                .startedAt(attempt.getStartedAt())
                                .finishedAt(attempt.getFinishedAt())
                                .durationSeconds(attempt.getDurationSeconds())
                                .sessionId(practicedSession == null
                                                ? null
                                                : practicedSession.getJlptExamSession().getId())
                                .sessionName(practicedSession == null
                                                ? null
                                                : practicedSession.getJlptExamSession().getName())
                                .build();
        }

        private String determineAttemptMode(List<UserJlptAttemptSession> attemptSessions) {
                return attemptSessions.size() == 1
                                ? SESSION_ATTEMPT_MODE
                                : FULL_ATTEMPT_MODE;
        }

        private boolean includesAttemptedSession(
                        ScoringSectionRule sectionRule,
                        List<UserJlptAttemptSession> attemptSessions) {
                return attemptSessions.stream()
                                .anyMatch(attemptSession -> sectionRule.includes(
                                                attemptSession.getJlptExamSession().getSessionType()));
        }

        private Map<Long, List<JlptAttemptResultResponse.PartResult>> buildResultParts(
                        List<UserJlptAttemptPart> attemptParts) {
                Map<Long, List<JlptAttemptResultResponse.PartResult>> partsByAttemptSessionId = new HashMap<>();

                for (UserJlptAttemptPart attemptPart : attemptParts) {
                        JlptAttemptResultResponse.PartResult partResult = JlptAttemptResultResponse.PartResult.builder()
                                        .attemptPartId(attemptPart.getId())
                                        .partId(attemptPart.getJlptExamPart().getId())
                                        .partName(attemptPart.getJlptExamPart().getName())
                                        .score(attemptPart.getScore())
                                        .maxScore(attemptPart.getMaxScore())
                                        .correctCount(attemptPart.getCorrectCount())
                                        .totalQuestions(attemptPart.getTotalQuestions())
                                        .build();

                        partsByAttemptSessionId
                                        .computeIfAbsent(
                                                        attemptPart.getAttemptSession().getId(),
                                                        ignored -> new ArrayList<>())
                                        .add(partResult);
                }

                return partsByAttemptSessionId;
        }

        private JlptAttemptResultResponse.SessionResult toResultSession(
                        UserJlptAttemptSession attemptSession,
                        List<JlptAttemptResultResponse.PartResult> parts) {
                JlptExamSession examSession = attemptSession.getJlptExamSession();

                return JlptAttemptResultResponse.SessionResult.builder()
                                .attemptSessionId(attemptSession.getId())
                                .sessionId(examSession.getId())
                                .sessionName(examSession.getName())
                                .sessionType(examSession.getSessionType())
                                .status(attemptSession.getStatus())
                                .score(attemptSession.getScore())
                                .maxScore(attemptSession.getMaxScore())
                                .correctCount(attemptSession.getCorrectCount())
                                .totalQuestions(attemptSession.getTotalQuestions())
                                .startedAt(attemptSession.getStartedAt())
                                .finishedAt(attemptSession.getFinishedAt())
                                .durationSeconds(attemptSession.getDurationSeconds())
                                .parts(parts)
                                .build();
        }

        private JlptAttemptResultResponse.ScoringSectionResult toScoringSectionResult(
                        ScoringSectionRule sectionRule,
                        List<UserJlptAttemptSession> attemptSessions) {
                BigDecimal score = BigDecimal.ZERO;
                BigDecimal maxScore = BigDecimal.ZERO;
                int correctCount = 0;
                int totalQuestions = 0;

                for (UserJlptAttemptSession attemptSession : attemptSessions) {
                        if (sectionRule.includes(attemptSession.getJlptExamSession().getSessionType())) {
                                score = score.add(attemptSession.getScore());
                                maxScore = maxScore.add(attemptSession.getMaxScore());
                                correctCount += attemptSession.getCorrectCount();
                                totalQuestions += attemptSession.getTotalQuestions();
                        }
                }

                return JlptAttemptResultResponse.ScoringSectionResult.builder()
                                .name(sectionRule.name())
                                .score(score)
                                .maxScore(maxScore)
                                .minimumPassScore(sectionRule.minimumPassScore())
                                .correctCount(correctCount)
                                .totalQuestions(totalQuestions)
                                .isPassed(score.compareTo(sectionRule.minimumPassScore()) >= 0)
                                .build();
        }

        private User getCurrentUser() {
                String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new BadRequestException("Unauthenticated"));
                return userRepository.findByEmail(currentUserEmail)
                                .orElseThrow(() -> new BadRequestException("User not found"));
        }

        private int calculateDurationSeconds(Instant startedAt, Instant finishedAt) {
                long durationSeconds = Duration.between(startedAt, finishedAt).getSeconds();
                return Math.toIntExact(Math.max(0L, durationSeconds));
        }

        private Sort buildSort(JlptExamQuery query) {

                String sortKey = query.getSortKey();

                String field = switch (sortKey == null ? "" : sortKey) {
                        case "id" -> "id";
                        case "title" -> "title";
                        case "jlptLevel" -> "jlptLevel";
                        case "description" -> "description";
                        case "totalTimeMinutes" -> "totalTimeMinutes";
                        case "isPublished" -> "isPublished";
                        case "createdAt" -> "createdAt";
                        case "updatedAt" -> "updatedAt";
                        default -> "id";
                };

                Sort.Direction direction;

                try {
                        direction = Sort.Direction.fromString(
                                        query.getSortType());
                } catch (IllegalArgumentException e) {
                        direction = Sort.Direction.DESC;
                }

                return Sort.by(direction, field);
        }

}
