package com.mycompany.saas_japanese.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseEnrollment;
import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.LessonProgress;
import com.mycompany.saas_japanese.domain.Quiz;
import com.mycompany.saas_japanese.domain.QuizOption;
import com.mycompany.saas_japanese.domain.QuizQuestion;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLessonProgress;
import com.mycompany.saas_japanese.domain.response.CourseProgressResponse;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import com.mycompany.saas_japanese.domain.response.LessonProgressResponse;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.domain.response.QuizAnswerResponse;
import com.mycompany.saas_japanese.domain.response.QuizResponse;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;
import com.mycompany.saas_japanese.repository.CourseEnrollmentRepository;
import com.mycompany.saas_japanese.repository.KanjiRepository;
import com.mycompany.saas_japanese.repository.LessonProgressRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.QuizOptionRepository;
import com.mycompany.saas_japanese.repository.QuizQuestionRepository;
import com.mycompany.saas_japanese.repository.QuizRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.repository.VocabularyRepository;
import com.mycompany.saas_japanese.service.StudyService;
import com.mycompany.saas_japanese.service.mapper.KanjiMapper;
import com.mycompany.saas_japanese.service.mapper.LessonMapper;
import com.mycompany.saas_japanese.service.mapper.LessonProgressMapper;
import com.mycompany.saas_japanese.service.mapper.QuizMapper;
import com.mycompany.saas_japanese.service.mapper.VocabularyMapper;
import com.mycompany.saas_japanese.util.SecurityUtil;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Service
@Transactional
public class StudyServiceImpl implements StudyService {
    
    UserRepository userRepository;

    LessonProgressRepository lessonProgressRepository;

    LessonRepository lessonRepository;

    VocabularyRepository vocabularyRepository;

    KanjiRepository kanjiRepository;

    QuizRepository quizRepository;

    QuizQuestionRepository quizQuestionRepository;

    QuizOptionRepository quizOptionRepository;

    CourseEnrollmentRepository courseEnrollmentRepository;

    LessonMapper lessonMapper;

    VocabularyMapper vocabularyMapper;

    KanjiMapper kanjiMapper;

    QuizMapper quizMapper;
    
    LessonProgressMapper lessonProgressMapper;

    @Override
    public List<LessonResponse> getLessonsByCourse(
            Long courseId) {
        User user = getCurrentUser();
        Long userId = user.getId();

        checkEnrollment(userId,courseId);

        List<Lesson> lessons = lessonRepository
                .findAllByCourseIdAndIsDeletedFalse(courseId);

        return lessons.stream()
                .filter(lesson -> Boolean.TRUE.equals(
                        lesson.getIsPublished()))
                .map(lessonMapper::toResponse)
                .toList();
    }

    @Override
    public LessonResponse getLessonDetail(
            Long lessonId) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));

        if (lesson.getCourse() == null) {
            throw new BadRequestException(
                    "Lesson chưa thuộc course");
        }

        User user = getCurrentUser();
        Long userId = user.getId();

        checkEnrollment(
                userId,
                lesson.getCourse().getId());

        checkPublished(lesson);

        return lessonMapper.toResponse(lesson);
    }

    @Override
    public List<VocabularyResponse> getVocabularies(
            Long lessonId) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));

        checkPublished(lesson);

        return vocabularyRepository
                .findAllByLessonIdAndDeletedAtIsNull(lessonId)
                .stream()
                .map(vocabularyMapper::toResponse)
                .toList();
    }

    @Override
    public List<KanjiResponse> getKanjis(
            Long lessonId) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));

        checkPublished(lesson);

        return kanjiRepository
                .findAllByLessonIdAndDeletedAtIsNull(lessonId)
                .stream()
                .map(kanjiMapper::toResponse)
                .toList();
    }

    @Override
    public QuizResponse getQuiz(
            Long lessonId) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));

        checkPublished(lesson);

        Quiz quiz = quizRepository
                .findByLessonIdAndDeletedAtIsNullAndIsPublishedTrue(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Không tìm thấy quiz của lesson"));

        List<QuizQuestion> questions =
                quizQuestionRepository
                        .findByQuizIdAndDeletedAtIsNullOrderBySortOrderAsc(
                                quiz.getId());

        Map<Long, List<QuizOption>> optionsByQuestionId =
                new HashMap<>();

        for (QuizQuestion question : questions) {

            List<QuizOption> options =
                    quizOptionRepository
                            .findByQuestionIdOrderBySortOrderAsc(
                                    question.getId());

            optionsByQuestionId.put(
                    question.getId(),
                    options);
        }

        return quizMapper.toResponse(
                quiz,
                questions,
                optionsByQuestionId);
    }

    @Override
    public QuizAnswerResponse answerQuestion(
            Long lessonId,
            Long quizId,
            Long questionId,
            Long optionId) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));

        checkPublished(lesson);

        Quiz quiz = quizRepository
                .findByIdAndDeletedAtIsNull(quizId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Quiz không tồn tại"));

        if (quiz.getLesson() == null
                || !quiz.getLesson()
                        .getId()
                        .equals(lessonId)) {

            throw new BadRequestException(
                    "Quiz không thuộc lesson này");
        }

        QuizQuestion question = quizQuestionRepository
                .findByIdAndDeletedAtIsNull(questionId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Câu hỏi không tồn tại"));

        if (question.getQuiz() == null
                || !question.getQuiz()
                        .getId()
                        .equals(quizId)) {

            throw new BadRequestException(
                    "Câu hỏi không thuộc quiz này");
        }

        QuizOption option = quizOptionRepository
                .findById(optionId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Đáp án không tồn tại"));

        if (option.getQuestion() == null
                || !option.getQuestion()
                        .getId()
                        .equals(questionId)) {

            throw new BadRequestException(
                    "Đáp án không thuộc câu hỏi này");
        }

        boolean correct = Boolean.TRUE.equals(
                option.getIsCorrect());

        Long correctOptionId = quizOptionRepository
                .findByQuestionIdOrderBySortOrderAsc(
                        questionId)
                .stream()
                .filter(o -> Boolean.TRUE.equals(
                        o.getIsCorrect()))
                .map(QuizOption::getId)
                .findFirst()
                .orElse(null);

        return QuizAnswerResponse.builder()
                .correct(correct)
                .correctOptionId(correctOptionId)
                .message(
                        correct
                                ? "Chính xác!"
                                : "Đáp án chưa chính xác!")
                .build();
    }

    @Override
    public LessonProgressResponse updateLessonProgress(
                Long lessonId,
                ReqUpdateLessonProgress request) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));


        if (lesson.getCourse() == null) {
                throw new BadRequestException(
                        "Lesson chưa thuộc course");
        }
        User user = getCurrentUser();
        Long userId = user.getId();
        Long courseId = lesson.getCourse().getId();
        checkPublished(lesson);
        checkEnrollment(userId, courseId);

        Integer watchDuration =
                request.getWatchDuration();

        Integer videoDuration =
                request.getVideoDuration();

        if (watchDuration == null || watchDuration < 0) {
                throw new BadRequestException(
                        "Watch duration không hợp lệ");
        }

        if (videoDuration == null || videoDuration <= 0) {
                throw new BadRequestException(
                        "Video duration không hợp lệ");
        }

        if (watchDuration > videoDuration) {
                watchDuration = videoDuration;
        }

        LessonProgress progress =
                lessonProgressRepository
                        .findByUserIdAndLessonId(userId, lessonId)
                        .orElse(null);

        if (progress == null) {

        progress = LessonProgress.builder()
                .user(user)
                .lesson(lesson)
                .watchDuration(watchDuration)
                .videoDuration(videoDuration)
                .progressPercent(BigDecimal.ZERO)
                .isCompleted(false)
                .build();

        } else {

                Integer oldWatchDuration =
                        progress.getWatchDuration();

                if (oldWatchDuration == null) {
                oldWatchDuration = 0;
                }

                progress.setWatchDuration(
                        Math.max(oldWatchDuration, watchDuration));
                progress.setVideoDuration(videoDuration);
        }

        BigDecimal progressPercent =
                BigDecimal.valueOf(progress.getWatchDuration())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(
                                progress.getVideoDuration()),
                                2,
                                RoundingMode.HALF_UP);

        if (progressPercent.compareTo(
                BigDecimal.valueOf(100)) > 0) {

                progressPercent =
                        BigDecimal.valueOf(100);
        }

        progress.setProgressPercent(progressPercent);
        progress.setLastWatchedAt(Instant.now());

        if (progressPercent.compareTo(
                BigDecimal.valueOf(80)) >= 0) {

                if (!Boolean.TRUE.equals(progress.getIsCompleted())) {

                progress.setIsCompleted(true);
                progress.setCompletedAt(
                        Instant.now());
                }

        }

        progress =lessonProgressRepository.save(progress);

        BigDecimal courseProgressPercent =
                calculateCourseProgress(userId, courseId);

        CourseEnrollment enrollment =
                courseEnrollmentRepository
                        .findByUserIdAndCourseId(userId, courseId)
                        .orElseThrow(
                                () -> new BadRequestException(
                                "Không tìm thấy đăng ký chương trình"));

        enrollment.setProgressPercent(courseProgressPercent);

        if (courseProgressPercent.compareTo(
                BigDecimal.valueOf(100)) >= 0) {

                if (enrollment.getCompletedAt() == null) {

                enrollment.setCompletedAt(
                        Instant.now());
                }
        }

        courseEnrollmentRepository.save(
                enrollment);

        return lessonProgressMapper.toResponse(
                progress,
                courseProgressPercent);
        }

    @Override
    @Transactional(readOnly = true)
    public LessonProgressResponse getLessonProgress(
                Long lessonId) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));

        if (lesson.getCourse() == null) {
                throw new BadRequestException(
                        "Lesson chưa thuộc course");
        }

        Long courseId =lesson.getCourse().getId();
        User user = getCurrentUser();
        Long userId = user.getId();
        checkEnrollment(userId, courseId);

        checkPublished(lesson);

        LessonProgress progress =lessonProgressRepository
                .findByUserIdAndLessonId(userId, lessonId)
                .orElse(null);

        // Chưa từng xem
        if (progress == null) {

                return LessonProgressResponse.builder()
                        .lessonId(lessonId)
                        .watchDuration(0)
                        .videoDuration(0)
                        .progressPercent(BigDecimal.ZERO)
                        .isCompleted(false)
                        .lastWatchedAt(null)
                        .completedAt(null)
                        .courseProgressPercent(
                                calculateCourseProgress(
                                        userId,
                                        courseId))
                        .build();
        }

        BigDecimal courseProgressPercent =calculateCourseProgress(userId, courseId);

        return lessonProgressMapper.toResponse(
                progress,
                courseProgressPercent);
        }

    @Override
    @Transactional(readOnly = true)
    public CourseProgressResponse getCourseProgress(
        Long courseId) {
        User user = getCurrentUser();
        Long userId = user.getId();
        CourseEnrollment enrollment = courseEnrollmentRepository
                        .findByUserIdAndCourseId(userId, courseId)
                        .orElseThrow(
                                () -> new BadRequestException(
                                        "Bạn chưa đăng ký chương trình này"));

        List<Lesson> lessons = lessonRepository
                        .findAllByCourseIdAndIsDeletedFalse(courseId)
                        .stream()
                        .filter(lesson ->Boolean.TRUE.equals(
                                lesson.getIsPublished()))
                        .toList();

        long totalLessons = lessons.size();

        long completedLessons = lessonProgressRepository
                        .countByUserIdAndLessonCourseIdAndIsCompletedTrue(
                                userId,
                                courseId);

        BigDecimal progressPercent;

        if (totalLessons == 0) {

                progressPercent = BigDecimal.ZERO;

        } else {
                progressPercent = BigDecimal.valueOf(completedLessons)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(BigDecimal.valueOf(totalLessons),
                                        2,
                                        RoundingMode.HALF_UP);
        }


        Course course = enrollment.getCourse();
        enrollment.setProgressPercent(progressPercent);
        if (progressPercent.compareTo(
                BigDecimal.valueOf(100)) >= 0) {
                if (enrollment.getCompletedAt() == null) {
                enrollment.setCompletedAt(Instant.now());
                }

        }

        courseEnrollmentRepository.save(enrollment);

        return CourseProgressResponse.builder()
                .courseId(courseId)
                .courseTitle(course.getTitle())
                .totalLessons(totalLessons)
                .completedLessons(completedLessons)
                .progressPercent(progressPercent)
                .completedAt(
                        enrollment.getCompletedAt())
                .build();
}

    private void checkEnrollment(
            Long userId,
            Long courseId) {

        boolean isEnrolled =
                courseEnrollmentRepository
                        .existsByUserIdAndCourseId(
                                userId,
                                courseId);

        if (!isEnrolled) {
            throw new BadRequestException(
                    "Bạn chưa đăng ký chương trình này");
        }
    }

    private void checkPublished(
            Lesson lesson) {

        if (!Boolean.TRUE.equals(
                lesson.getIsPublished())) {

            throw new BadRequestException(
                    "Lesson chưa được công khai");
        }
    }

        private BigDecimal calculateCourseProgress(
                Long userId,
                Long courseId) {

        long totalLessons =lessonRepository
                .countByCourseIdAndIsDeletedFalse(courseId);

        if (totalLessons == 0) {
                return BigDecimal.ZERO;
        }

        long completedLessons =lessonProgressRepository
                .countByUserIdAndLessonCourseIdAndIsCompletedTrue(userId, courseId);

        return BigDecimal.valueOf(
                completedLessons)
                .multiply(BigDecimal.valueOf(100))
                .divide(
                        BigDecimal.valueOf(totalLessons),
                        2,
                        RoundingMode.HALF_UP);
        }

        private User getCurrentUser() {

                String email = SecurityUtil
                        .getCurrentUserLogin()
                        .orElseThrow(
                                () -> new BadRequestException(
                                        "Người dùng chưa đăng nhập"));

                return userRepository
                        .findByEmail(email)
                        .orElseThrow(
                                () -> new NotFoundException(
                                        "Người dùng không tồn tại"));
}
}