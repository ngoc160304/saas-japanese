package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.service.mapper.LessonGrammarVideoMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Quiz;
import com.mycompany.saas_japanese.domain.QuizOption;
import com.mycompany.saas_japanese.domain.QuizQuestion;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import com.mycompany.saas_japanese.domain.response.LessonGrammarVideoResponse;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.domain.response.QuizAnswerResponse;
import com.mycompany.saas_japanese.domain.response.QuizResponse;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;
import com.mycompany.saas_japanese.repository.CourseEnrollmentRepository;
import com.mycompany.saas_japanese.repository.KanjiRepository;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.QuizOptionRepository;
import com.mycompany.saas_japanese.repository.QuizQuestionRepository;
import com.mycompany.saas_japanese.repository.QuizRepository;
import com.mycompany.saas_japanese.repository.VocabularyRepository;
import com.mycompany.saas_japanese.service.StudyService;
import com.mycompany.saas_japanese.service.mapper.KanjiMapper;
import com.mycompany.saas_japanese.service.mapper.LessonMapper;
import com.mycompany.saas_japanese.service.mapper.QuizMapper;
import com.mycompany.saas_japanese.service.mapper.VocabularyMapper;
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

    LessonGrammarVideoMapper lessonGrammarVideoMapper;

    @Override
    public List<LessonResponse> getLessonsByCourse(
            Long courseId,
            Long userId) {

        checkEnrollment(
                userId,
                courseId);

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
            Long lessonId,
            Long userId) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));

        if (lesson.getCourse() == null) {
            throw new BadRequestException(
                    "Lesson chưa thuộc course");
        }

        checkEnrollment(
                userId,
                lesson.getCourse().getId());

        checkPublished(lesson);

        return lessonMapper.toResponse(lesson);
    }

    @Override
    public LessonGrammarVideoResponse getGrammarVideo(
            Long lessonId) {

        Lesson lesson = lessonRepository
                .findByIdAndIsDeletedFalse(lessonId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Lesson không tồn tại"));

        checkPublished(lesson);

        return lessonGrammarVideoMapper.toResponse(lesson);
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
}