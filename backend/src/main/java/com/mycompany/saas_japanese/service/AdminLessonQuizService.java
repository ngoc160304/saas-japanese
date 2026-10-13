package com.mycompany.saas_japanese.service;

import java.util.List;
import java.util.Optional;

import com.mycompany.saas_japanese.domain.request.ReqAdminLessonQuiz;
import com.mycompany.saas_japanese.domain.request.ReqQuizQuestion;
import com.mycompany.saas_japanese.domain.response.AdminLessonQuizResponse;

public interface AdminLessonQuizService {
  Optional<AdminLessonQuizResponse> findCurrent(Long lessonId);
  AdminLessonQuizResponse create(Long lessonId, ReqAdminLessonQuiz request);
  AdminLessonQuizResponse update(Long lessonId, Long quizId, ReqAdminLessonQuiz request);
  AdminLessonQuizResponse publish(Long lessonId, Long quizId, boolean published);
  void delete(Long lessonId, Long quizId);
  AdminLessonQuizResponse createQuestion(Long lessonId, Long quizId, ReqQuizQuestion request);
  AdminLessonQuizResponse updateQuestion(Long lessonId, Long quizId, Long questionId, ReqQuizQuestion request);
  void deleteQuestion(Long lessonId, Long quizId, Long questionId);
  AdminLessonQuizResponse reorder(Long lessonId, Long quizId, List<Long> questionIds);
}
