package com.mycompany.saas_japanese.service.mapper;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Quiz;
import com.mycompany.saas_japanese.domain.QuizOption;
import com.mycompany.saas_japanese.domain.QuizQuestion;
import com.mycompany.saas_japanese.domain.response.QuizOptionResponse;
import com.mycompany.saas_japanese.domain.response.QuizQuestionResponse;
import com.mycompany.saas_japanese.domain.response.QuizResponse;

@Component
public class QuizMapper {

    public QuizResponse toResponse(
            Quiz quiz,
            List<QuizQuestion> questions,
            Map<Long, List<QuizOption>> optionsByQuestionId) {

        if (quiz == null) {
            return null;
        }

        List<QuizQuestionResponse> questionResponses =
                questions == null
                        ? List.of()
                        : questions.stream()
                                .map(question -> toQuestionResponse(
                                        question,
                                        optionsByQuestionId))
                                .toList();

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .questions(questionResponses)
                .build();
    }

    private QuizQuestionResponse toQuestionResponse(
            QuizQuestion question,
            Map<Long, List<QuizOption>> optionsByQuestionId) {

        List<QuizOption> options =
                optionsByQuestionId.getOrDefault(
                        question.getId(),
                        List.of());

        List<QuizOptionResponse> optionResponses =
                options.stream()
                        .map(this::toOptionResponse)
                        .toList();

        return QuizQuestionResponse.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .questionType(
                        question.getQuestionType() != null
                                ? question.getQuestionType().name()
                                : null)
                .sortOrder(question.getSortOrder())
                .options(optionResponses)
                .build();
    }

    private QuizOptionResponse toOptionResponse(
            QuizOption option) {

        return QuizOptionResponse.builder()
                .id(option.getId())
                .optionText(option.getOptionText())
                .sortOrder(option.getSortOrder())
                .build();
    }
}
