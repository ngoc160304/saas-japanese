package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.query.LessonQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateLesson;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLesson;

public interface LessonService {

  Lesson createLesson(ReqCreateLesson request);

  Lesson fetchLessonById(Long id);

  Page<Lesson> fetchAllLesson(LessonQuery query);

  Lesson updateLesson(Long id, ReqUpdateLesson request);

  void deleteLesson(Long id);

  void deleteByCourseId(long courseId);
}
