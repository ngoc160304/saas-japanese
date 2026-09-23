package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.response.LessonGrammarVideoResponse;

@Component 
public class LessonGrammarVideoMapper {

    public LessonGrammarVideoResponse toResponse(
            Lesson lesson) {

        if (lesson == null) {
            return null;
        }

        return LessonGrammarVideoResponse.builder()
                .grammar(lesson.getGrammar())
                .videoUrl(
                        lesson.getVideoMedia() != null
                                ? lesson.getVideoMedia().getSecureUrl()
                                : null)
                .build();
    }
}
