package com.mycompany.saas_japanese.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.JlptExam;
import com.mycompany.saas_japanese.domain.JlptExamAnswer;
import com.mycompany.saas_japanese.domain.JlptExamPart;
import com.mycompany.saas_japanese.domain.UserJlptAttempt;
import com.mycompany.saas_japanese.domain.JlptExamQuestion;
import com.mycompany.saas_japanese.domain.query.JlptExamQuery;
import com.mycompany.saas_japanese.domain.request.ReqStartJjptAttempt;
import com.mycompany.saas_japanese.domain.response.JlptExamDetailResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamPartResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamResponse;
import com.mycompany.saas_japanese.domain.response.JlptExamSessionResponse;
import com.mycompany.saas_japanese.domain.response.StartJlptAttemptResponse;
import com.mycompany.saas_japanese.repository.JlptExamAnswerRepository;
import com.mycompany.saas_japanese.repository.JlptExamPartRepository;
import com.mycompany.saas_japanese.repository.JlptExamQuestionRepository;
import com.mycompany.saas_japanese.repository.JlptExamRepository;
import com.mycompany.saas_japanese.repository.JlptExamSessionRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptPartRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptRepository;
import com.mycompany.saas_japanese.repository.UserJlptAttemptSessionRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.JlptExamService;
import com.mycompany.saas_japanese.service.mapper.JlptExamMapper;
import com.mycompany.saas_japanese.specification.JlptExamSpecs;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import com.mycompany.saas_japanese.domain.JlptExamSession;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.UserJlptAttemptPart;
import com.mycompany.saas_japanese.domain.UserJlptAttemptSession;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JlptExamServiceImpl implements JlptExamService {
        private final JlptExamRepository jlptExamRepository;
        private final JlptExamMapper jlptExamMapper;
        private final UserRepository userRepository;
        private final JlptExamSessionRepository jlptExamSessionRepository;
        private final JlptExamPartRepository jlptExamPartRepository;
        private final JlptExamAnswerRepository jlptExamAnswerRepository;
        private final JlptExamQuestionRepository jlptExamQuestionRepository;
        private final UserJlptAttemptSessionRepository userJlptAttemptSessionRepository;
        private final UserJlptAttemptPartRepository userJlptAttemptPartRepository;
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
                // =========================================================
                // 1. Validate request
                // =========================================================

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

                // =========================================================
                // 2. Get Exam
                // =========================================================

                JlptExam exam = jlptExamRepository.findById(examId)
                                .orElseThrow(() -> new RuntimeException("JLPT exam not found"));

                // =========================================================
                // 3. Get current user
                // =========================================================
                User user = userRepository.findById(request.getUserId())
                                .orElseThrow(() -> new RuntimeException("User not found"));
                // =========================================================
                // 4. Determine sessions
                // =========================================================

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

                // =========================================================
                // 5. Create UserJlptAttempt
                // =========================================================

                UserJlptAttempt attempt = UserJlptAttempt.builder()
                                .user(user)
                                .jlptExam(exam)
                                .startedAt(Instant.now())
                                .build();

                attempt = userJlptAttemptRepository.save(attempt);

                // =========================================================
                // 6. Create Attempt Sessions
                // =========================================================

                List<StartJlptAttemptResponse.AttemptSessionResponse> sessionResponses = new ArrayList<>();

                for (JlptExamSession examSession : sessions) {

                        UserJlptAttemptSession attemptSession = UserJlptAttemptSession.builder()
                                        .attempt(attempt)
                                        .jlptExamSession(examSession)
                                        .startedAt(Instant.now())
                                        .build();

                        attemptSession = userJlptAttemptSessionRepository
                                        .save(attemptSession);

                        // =====================================================
                        // 7. Get Parts
                        // =====================================================

                        List<JlptExamPart> parts = jlptExamPartRepository
                                        .findByJlptExamSession_IdOrderBySortOrderAsc(
                                                        examSession.getId());

                        List<StartJlptAttemptResponse.AttemptPartResponse> partResponses = new ArrayList<>();

                        for (JlptExamPart examPart : parts) {

                                // ================================================
                                // 8. Create Attempt Part
                                // ================================================

                                UserJlptAttemptPart attemptPart = UserJlptAttemptPart.builder()
                                                .attemptSession(attemptSession)
                                                .jlptExamPart(examPart)
                                                .build();

                                attemptPart = userJlptAttemptPartRepository
                                                .save(attemptPart);

                                // ================================================
                                // 9. Get Questions
                                // ================================================

                                List<JlptExamQuestion> questions = jlptExamQuestionRepository
                                                .findByJlptExamPartIdOrderBySortOrderAsc(
                                                                examPart.getId());

                                List<StartJlptAttemptResponse.QuestionResponse> questionResponses = new ArrayList<>();

                                for (JlptExamQuestion question : questions) {

                                        // ============================================
                                        // 10. Get Answers
                                        // ============================================

                                        List<JlptExamAnswer> answers = jlptExamAnswerRepository
                                                        .findByJlptExamQuestionIdOrderBySortOrderAsc(
                                                                        question.getId());

                                        List<StartJlptAttemptResponse.AnswerResponse> answerResponses = answers.stream()
                                                        .map(answer -> StartJlptAttemptResponse.AnswerResponse
                                                                        .builder()
                                                                        .answerId(answer.getId())
                                                                        .answerText(
                                                                                        answer.getAnswerText())
                                                                        .build())
                                                        .toList();

                                        // ============================================
                                        // 11. Question response
                                        // ============================================

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

                                // ================================================
                                // 12. Part response
                                // ================================================

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

                        // =====================================================
                        // 13. Session response
                        // =====================================================

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

                // =========================================================
                // 14. Final response
                // =========================================================

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
