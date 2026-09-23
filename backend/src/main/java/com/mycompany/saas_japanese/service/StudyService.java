package com.mycompany.saas_japanese.service;

import java.util.List;

import com.mycompany.saas_japanese.domain.request.ReqUpdateLessonProgress;
import com.mycompany.saas_japanese.domain.response.CourseProgressResponse;
import com.mycompany.saas_japanese.domain.response.KanjiResponse;
import com.mycompany.saas_japanese.domain.response.LessonProgressResponse;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.domain.response.QuizAnswerResponse;
import com.mycompany.saas_japanese.domain.response.QuizResponse;
import com.mycompany.saas_japanese.domain.response.VocabularyResponse;

public interface StudyService {
    List<LessonResponse> getLessonsByCourse(Long courseId);

    LessonResponse getLessonDetail(Long lessonId);

    List<VocabularyResponse> getVocabularies(Long lessonId);

    List<KanjiResponse> getKanjis(Long lessonId);
    
    QuizResponse getQuiz(Long lessonId);

    QuizAnswerResponse answerQuestion(Long lessonId, Long quizId, Long questionId, Long optionId);

    LessonProgressResponse updateLessonProgress(Long lessonId, ReqUpdateLessonProgress request);

    LessonProgressResponse getLessonProgress(Long lessonId);

    CourseProgressResponse getCourseProgress(Long courseId);
}
