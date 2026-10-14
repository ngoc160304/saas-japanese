package com.mycompany.saas_japanese.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseEnrollment;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.LessonProgress;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.Quiz;
import com.mycompany.saas_japanese.domain.QuizOption;
import com.mycompany.saas_japanese.domain.QuizQuestion;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLessonProgress;
import com.mycompany.saas_japanese.domain.response.CourseProgressResponse;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import com.mycompany.saas_japanese.domain.response.LessonProgressResponse;
import com.mycompany.saas_japanese.domain.response.QuizAnswerResponse;
import com.mycompany.saas_japanese.domain.response.QuizResponse;
import com.mycompany.saas_japanese.domain.response.StudentLessonResponse;
import com.mycompany.saas_japanese.domain.response.StudentLessonSummaryResponse;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;
import com.mycompany.saas_japanese.repository.CourseEnrollmentRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.KanjiRepository;
import com.mycompany.saas_japanese.repository.LessonProgressRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.QuizOptionRepository;
import com.mycompany.saas_japanese.repository.QuizQuestionRepository;
import com.mycompany.saas_japanese.repository.QuizRepository;
import com.mycompany.saas_japanese.repository.StudyCourseStatistics;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.repository.VocabularyRepository;
import com.mycompany.saas_japanese.service.StudyService;
import com.mycompany.saas_japanese.service.mapper.KanjiMapper;
import com.mycompany.saas_japanese.service.mapper.LessonMapper;
import com.mycompany.saas_japanese.service.mapper.LessonProgressMapper;
import com.mycompany.saas_japanese.service.mapper.QuizMapper;
import com.mycompany.saas_japanese.service.mapper.VocabularyMapper;
import com.mycompany.saas_japanese.util.SecurityUtil;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.ConflictException;
import com.mycompany.saas_japanese.util.error.ForbiddenException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class StudyServiceImpl implements StudyService {
    private final UserRepository userRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final VocabularyRepository vocabularyRepository;
    private final KanjiRepository kanjiRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final LessonMapper lessonMapper;
    private final VocabularyMapper vocabularyMapper;
    private final KanjiMapper kanjiMapper;
    private final QuizMapper quizMapper;
    private final LessonProgressMapper lessonProgressMapper;

    @Override
    public List<StudentLessonSummaryResponse> getLessonsByCourse(Long courseId) {
        User user = getCurrentUser();
        availableCourse(courseId);
        requireEnrollment(user.getId(), courseId);
        return lessonRepository.findStudyLessons(courseId, user.getId());
    }

    @Override
    public StudentLessonResponse getLessonDetail(Long lessonId) {
        User user = getCurrentUser();
        return lessonMapper.toStudentResponse(authorizedLesson(user.getId(), lessonId));
    }

    @Override
    public List<VocabularyResponse> getVocabularies(Long lessonId) {
        authorizedLesson(getCurrentUser().getId(), lessonId);
        return vocabularyRepository.findAllByLessonIdAndDeletedAtIsNull(lessonId).stream()
                .map(vocabularyMapper::toResponse).toList();
    }

    @Override
    public List<KanjiResponse> getKanjis(Long lessonId) {
        authorizedLesson(getCurrentUser().getId(), lessonId);
        return kanjiRepository.findAllByLessonIdAndDeletedAtIsNull(lessonId).stream()
                .map(kanjiMapper::toResponse).toList();
    }

    @Override
    public Optional<QuizResponse> getQuiz(Long lessonId) {
        authorizedLesson(getCurrentUser().getId(), lessonId);
        return publishedQuiz(lessonId).map(quiz -> {
            List<QuizQuestion> questions = quizQuestionRepository
                    .findByQuizIdAndDeletedAtIsNullOrderBySortOrderAscIdAsc(quiz.getId());
            Map<Long, List<QuizOption>> optionsByQuestionId = questions.isEmpty() ? Map.of()
                    : quizOptionRepository.findByQuestionIdInOrderBySortOrderAscIdAsc(
                            questions.stream().map(QuizQuestion::getId).toList()).stream()
                            .collect(Collectors.groupingBy(option -> option.getQuestion().getId()));
            return quizMapper.toResponse(quiz, questions, optionsByQuestionId);
        });
    }

    @Override
    @Transactional
    public QuizAnswerResponse answerQuestion(Long lessonId, Long quizId, Long questionId, Long optionId) {
        User user = getCurrentUser();
        // Match the administration lock so option replacement cannot race answer evaluation.
        Lesson lesson = lessonRepository.findActiveForUpdate(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
        Course course = lesson.getCourse();
        if (!Boolean.TRUE.equals(lesson.getIsPublished()) || lesson.getDeletedAt() != null
                || course == null || !Boolean.TRUE.equals(course.getIsPublished()) || course.getDeletedAt() != null) {
            throw new NotFoundException("Lesson not found");
        }
        requireEnrollment(user.getId(), course.getId());
        Quiz quiz = publishedQuiz(lessonId).filter(item -> item.getId().equals(quizId))
                .orElseThrow(() -> new NotFoundException("Quiz not found in this lesson"));
        QuizQuestion question = quizQuestionRepository.findByIdAndDeletedAtIsNull(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found"));
        if (question.getQuiz() == null || !question.getQuiz().getId().equals(quiz.getId())) {
            throw new BadRequestException("Question does not belong to this quiz");
        }
        QuizOption option = quizOptionRepository.findById(optionId)
                .orElseThrow(() -> new NotFoundException("Option not found"));
        if (option.getQuestion() == null || !option.getQuestion().getId().equals(questionId)) {
            throw new BadRequestException("Option does not belong to this question");
        }
        boolean correct = Boolean.TRUE.equals(option.getIsCorrect());
        Long correctOptionId = quizOptionRepository.findByQuestionIdOrderBySortOrderAsc(questionId).stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsCorrect())).map(QuizOption::getId)
                .findFirst().orElse(null);
        return QuizAnswerResponse.builder().correct(correct).correctOptionId(correctOptionId)
                .message(correct ? "Chính xác!" : "Đáp án chưa chính xác!").build();
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public LessonProgressResponse updateLessonProgress(Long lessonId, ReqUpdateLessonProgress request) {
        User user = getCurrentUser();
        Lesson lesson = lessonRepository.findAvailableForStudy(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
        Long courseId = lesson.getCourse().getId();
        // Serialize all lesson updates for this enrollment, including the first insert and course totals.
        // READ_COMMITTED ensures queries after waiting on the lock see the preceding writer's changes on MySQL.
        CourseEnrollment enrollment = courseEnrollmentRepository.findForStudyUpdate(user.getId(), courseId)
                .orElseThrow(() -> new ForbiddenException("Course enrollment required"));
        validateVideoProgress(lesson, request);
        int videoDuration = request.getVideoDuration();
        LessonProgress progress = lessonProgressRepository.findByUserIdAndLessonId(user.getId(), lessonId)
                .orElseGet(() -> LessonProgress.builder().user(user).lesson(lesson).watchDuration(0)
                        .isCompleted(false).build());
        int previousWatch = progress.getWatchDuration() == null ? 0 : progress.getWatchDuration();
        int watched = Math.min(videoDuration, Math.max(previousWatch, request.getWatchDuration()));
        progress.setWatchDuration(watched);
        progress.setVideoDuration(videoDuration);
        progress.setProgressPercent(percentage(watched, videoDuration));
        Instant now = Instant.now();
        progress.setLastWatchedAt(now);
        // Evaluate the exact boundary before display rounding. Completion is sticky across later updates.
        if ((long) watched * 100 >= (long) videoDuration * 80 && !Boolean.TRUE.equals(progress.getIsCompleted())) {
            progress.setIsCompleted(true);
            progress.setCompletedAt(now);
        }
        lessonProgressRepository.saveAndFlush(progress);
        BigDecimal coursePercent = coursePercentage(lessonRepository.summarizeStudyProgress(courseId, user.getId()));
        enrollment.setProgressPercent(coursePercent);
        if (coursePercent.compareTo(BigDecimal.valueOf(100)) == 0 && enrollment.getCompletedAt() == null) {
            enrollment.setCompletedAt(now);
        }
        courseEnrollmentRepository.save(enrollment);
        return lessonProgressMapper.toResponse(progress, coursePercent);
    }

    @Override
    public LessonProgressResponse getLessonProgress(Long lessonId) {
        User user = getCurrentUser();
        Lesson lesson = authorizedLesson(user.getId(), lessonId);
        BigDecimal coursePercent = coursePercentage(
                lessonRepository.summarizeStudyProgress(lesson.getCourse().getId(), user.getId()));
        return lessonProgressRepository.findByUserIdAndLessonId(user.getId(), lessonId)
                .map(progress -> lessonProgressMapper.toResponse(progress, coursePercent))
                .orElseGet(() -> LessonProgressResponse.builder().lessonId(lessonId).watchDuration(0).videoDuration(0)
                        .progressPercent(BigDecimal.ZERO).isCompleted(false)
                        .courseProgressPercent(coursePercent).build());
    }

    @Override
    public CourseProgressResponse getCourseProgress(Long courseId) {
        User user = getCurrentUser();
        Course course = availableCourse(courseId);
        CourseEnrollment enrollment = requireEnrollment(user.getId(), courseId);
        StudyCourseStatistics statistics = lessonRepository.summarizeStudyProgress(courseId, user.getId());
        return CourseProgressResponse.builder().courseId(courseId).courseTitle(course.getTitle())
                .totalLessons(statistics.getTotalLessons()).completedLessons(statistics.getCompletedLessons())
                .progressPercent(coursePercentage(statistics)).completedAt(enrollment.getCompletedAt()).build();
    }

    private Course availableCourse(Long courseId) {
        return courseRepository.findAvailableForStudy(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));
    }

    private Lesson authorizedLesson(Long userId, Long lessonId) {
        Lesson lesson = lessonRepository.findAvailableForStudy(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
        requireEnrollment(userId, lesson.getCourse().getId());
        return lesson;
    }

    private CourseEnrollment requireEnrollment(Long userId, Long courseId) {
        return courseEnrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ForbiddenException("Course enrollment required"));
    }

    private Optional<Quiz> publishedQuiz(Long lessonId) {
        List<Quiz> active = quizRepository.findByLessonIdAndDeletedAtIsNull(lessonId);
        if (active.size() > 1) {
            throw new ConflictException("Multiple active quizzes exist for this lesson; administrator repair required");
        }
        return active.stream().filter(quiz -> Boolean.TRUE.equals(quiz.getIsPublished())).findFirst();
    }

    private void validateVideoProgress(Lesson lesson, ReqUpdateLessonProgress request) {
        Media video = lesson.getVideoMedia();
        if (video == null || !Boolean.FALSE.equals(video.getIsDeleted()) || video.getDeletedAt() != null
                || video.getFileType() != FileTypeEnum.VIDEO || video.getSecureUrl() == null
                || video.getSecureUrl().isBlank()) {
            throw new BadRequestException("This lesson has no available video to track");
        }
        if (request == null || request.getWatchDuration() == null || request.getWatchDuration() < 0
                || request.getVideoDuration() == null || request.getVideoDuration() <= 0) {
            throw new BadRequestException("watchDuration must be non-negative and videoDuration positive (seconds)");
        }
    }

    private BigDecimal coursePercentage(StudyCourseStatistics statistics) {
        return percentage(statistics.getCompletedLessons(), statistics.getTotalLessons());
    }

    private BigDecimal percentage(long completed, long total) {
        return total == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(completed).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP).max(BigDecimal.ZERO)
                .min(BigDecimal.valueOf(100));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new InsufficientAuthenticationException("Authentication required");
        }
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new InsufficientAuthenticationException("Authentication required"));
        return userRepository.findByEmail(email).filter(user -> user.isActive() && user.isVerified())
                .orElseThrow(() -> new InsufficientAuthenticationException("Authenticated user unavailable"));
    }
}
