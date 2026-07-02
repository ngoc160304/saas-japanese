package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LessonServiceImpl implements LessonService {

    @Autowired
    private LessonRepository lessonRepository;

    @Override
    public List<Lesson> getAll() {
        return lessonRepository.findByDeletedAtIsNull();
    }

    @Override
    public List<Lesson> getByCourse(Long courseId) {
        return lessonRepository.findByCourseIdAndDeletedAtIsNull(courseId);
    }

    @Override
    public Lesson getById(Long id) {
        return lessonRepository.findById(id).filter(l -> l.getDeletedAt() == null).orElse(null);
    }

    @Override
    public Lesson create(Lesson lesson) {
        return lessonRepository.save(lesson);
    }

    @Override
    public Lesson update(Long id, Lesson details) {
        Lesson lesson = getById(id);
        if (lesson != null) {
            lesson.setTitle(details.getTitle());
            lesson.setSlug(details.getSlug());
            lesson.setContent(details.getContent());
            lesson.setDurationMinutes(details.getDurationMinutes());
            lesson.setSortOrder(details.getSortOrder());
            lesson.setPublished(details.isPublished());
            lesson.setVideoMediaId(details.getVideoMediaId());
            lesson.setUpdatedAt(LocalDateTime.now());
            return lessonRepository.save(lesson);
        }
        return null;
    }

    @Override
    public void delete(Long id) {
        Lesson lesson = getById(id);
        if (lesson != null) {
            lesson.setDeletedAt(LocalDateTime.now());
            lessonRepository.save(lesson);
        }
    }
}