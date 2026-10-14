package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.domain.response.StudentLessonResponse;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;

@Component
public class LessonMapper {

  public StudentLessonResponse toStudentResponse(Lesson lesson) {
    Media video = lesson.getVideoMedia();
    String videoUrl = video != null && Boolean.FALSE.equals(video.getIsDeleted()) && video.getDeletedAt() == null
        && video.getFileType() == FileTypeEnum.VIDEO ? video.getSecureUrl() : null;
    return new StudentLessonResponse(lesson.getId(), lesson.getCourse().getId(), lesson.getTitle(), lesson.getSlug(),
        blankToNull(lesson.getGrammar()), lesson.getDurationMinutes(), blankToNull(videoUrl));
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value;
  }

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
