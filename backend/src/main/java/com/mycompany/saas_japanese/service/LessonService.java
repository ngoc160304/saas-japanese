package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.query.LessonQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateLesson;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLesson;
import com.mycompany.saas_japanese.domain.response.LessonResponse;

public interface LessonService {

  LessonResponse createLesson(ReqCreateLesson request);

  LessonResponse fetchLessonById(Long id);

  Page<LessonResponse> fetchAllLesson(LessonQuery query);

  LessonResponse updateLesson(Long id, ReqUpdateLesson request);

  void deleteLesson(Long id);

  void deleteByCourseId(long courseId);
}
