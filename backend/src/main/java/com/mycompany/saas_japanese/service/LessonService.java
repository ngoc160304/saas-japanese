package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.Lesson;
import java.util.List;

public interface LessonService {
    List<Lesson> getAll();

    List<Lesson> getByCourse(Long courseId);

    Lesson getById(Long id);

    Lesson create(Lesson lesson);

    Lesson update(Long id, Lesson lessonDetails);

    void delete(Long id);

    List<Lesson> getPublishedLessonsByCourse(Long courseId);

}