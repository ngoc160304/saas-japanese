package com.mycompany.saas_japanese.service.mapper;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Quiz;
import com.mycompany.saas_japanese.domain.QuizOption;
import com.mycompany.saas_japanese.domain.QuizQuestion;
import com.mycompany.saas_japanese.domain.response.AdminLessonQuizResponse;
import com.mycompany.saas_japanese.util.constant.QuizQuestionTypeEnum;

@Component
public class AdminLessonQuizMapper {
  public AdminLessonQuizResponse toResponse(Quiz quiz, List<QuizQuestion> questions,
      Map<Long, List<QuizOption>> options) {
    return new AdminLessonQuizResponse(quiz.getId(), quiz.getLesson().getId(), quiz.getTitle(),
        quiz.getDescription(), quiz.getIsPublished(), quiz.getCreatedAt(), quiz.getUpdatedAt(),
        questions.stream().map(question -> new AdminLessonQuizResponse.Question(
            question.getId(), question.getQuestionType(), question.getQuestionText(), question.getSortOrder(),
            question.getQuestionType() == QuizQuestionTypeEnum.SINGLE_CHOICE,
            question.getCreatedAt(), question.getUpdatedAt(),
            options.getOrDefault(question.getId(), List.of()).stream()
                .map(option -> new AdminLessonQuizResponse.Option(option.getId(), option.getOptionText(),
                    option.getSortOrder(), option.getIsCorrect())).toList())).toList());
  }
}
