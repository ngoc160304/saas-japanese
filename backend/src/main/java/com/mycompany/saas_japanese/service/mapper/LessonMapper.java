package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.response.LessonResponse;

@Component
public class LessonMapper {

  public LessonResponse toResponse(Lesson lesson) {
    if (lesson == null) {
      return null;
    }

    LessonResponse response = new LessonResponse();

    response.setId(lesson.getId());
    response.setTitle(lesson.getTitle());
    response.setSlug(lesson.getSlug());
    response.setGrammar(lesson.getGrammar());
    response.setDurationMinutes(lesson.getDurationMinutes());
    response.setIsPublished(lesson.getIsPublished());
    response.setIsDeleted(lesson.getIsDeleted());
    response.setCreatedAt(lesson.getCreatedAt());
    response.setUpdatedAt(lesson.getUpdatedAt());

    if (lesson.getCourse() != null) {
      response.setCourseId(
          lesson.getCourse().getId());
    }

    if (lesson.getVideoMedia() != null) {
      response.setVideoMediaId(
          lesson.getVideoMedia().getId());

      response.setVideoUrl(
          lesson.getVideoMedia().getSecureUrl());
    }

    return response;
  }
}
