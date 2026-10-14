package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;
import java.util.List;

import com.mycompany.saas_japanese.util.constant.QuizQuestionTypeEnum;

public record AdminLessonQuizResponse(
    Long id, Long lessonId, String title, String description, Boolean isPublished,
    Instant createdAt, Instant updatedAt, List<Question> questions) {

  public AdminLessonQuizResponse {
    questions = List.copyOf(questions);
  }

  public record Question(
      Long id, QuizQuestionTypeEnum questionType, String questionText, Integer sortOrder,
      boolean authoringSupported, Instant createdAt, Instant updatedAt, List<Option> options) {
    public Question {
      options = List.copyOf(options);
    }
  }

  public record Option(Long id, String optionText, Integer sortOrder, Boolean isCorrect) {
  }
}
