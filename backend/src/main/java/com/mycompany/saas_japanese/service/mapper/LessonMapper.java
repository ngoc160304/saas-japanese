package com.mycompany.saas_japanese.service.mapper;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.LessonVideo;
import com.mycompany.saas_japanese.domain.request.ReqCreateLesson;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLesson;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.domain.response.LessonVideoResponse;
import com.mycompany.saas_japanese.repository.LessonVideoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LessonMapper {

    @Autowired
    private LessonVideoRepository lessonVideoRepository;

    public Lesson toEntity(ReqCreateLesson request) {
        if (request == null) return null;
        Lesson lesson = new Lesson();
        lesson.setCourseId(request.getCourseId());
        lesson.setTitle(request.getTitle());
        lesson.setSlug(request.getSlug());
        lesson.setContent(request.getContent());
        lesson.setDurationMinutes(request.getDurationMinutes());
        lesson.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0L);
        lesson.setPublished(request.isPublished());
        return lesson;
    }

    public void updateEntity(Lesson lesson, ReqUpdateLesson request) {
        if (request == null || lesson == null) return;
        lesson.setCourseId(request.getCourseId());
        lesson.setTitle(request.getTitle());
        lesson.setSlug(request.getSlug());
        lesson.setContent(request.getContent());
        lesson.setDurationMinutes(request.getDurationMinutes());
        if (request.getSortOrder() != null) {
            lesson.setSortOrder(request.getSortOrder());
        }
        lesson.setPublished(request.isPublished());
    }

    public LessonResponse toResponse(Lesson lesson) {
        if (lesson == null) return null;
        LessonResponse response = new LessonResponse();
        response.setId(lesson.getId());
        response.setCourseId(lesson.getCourseId());
        response.setTitle(lesson.getTitle());
        response.setSlug(lesson.getSlug());
        response.setContent(lesson.getContent());
        response.setDurationMinutes(lesson.getDurationMinutes());
        response.setSortOrder(lesson.getSortOrder());
        response.setPublished(lesson.isPublished());
        response.setStatus(lesson.getStatus());
        response.setCreatedAt(lesson.getCreatedAt());
        response.setUpdatedAt(lesson.getUpdatedAt());

        // Load danh sách video từ bảng lesson_videos
        List<LessonVideo> videoList = lessonVideoRepository.findByLessonIdOrderBySortOrderAsc(lesson.getId());
        response.setVideos(videoList.stream().map(this::toVideoResponse).toList());

        return response;
    }

    private LessonVideoResponse toVideoResponse(LessonVideo lv) {
        LessonVideoResponse r = new LessonVideoResponse();
        r.setId(lv.getId());
        r.setLessonId(lv.getLessonId());
        r.setMediaId(lv.getMediaId());
        r.setVideoUrl(lv.getVideoUrl());
        r.setTitle(lv.getTitle());
        r.setSortOrder(lv.getSortOrder());
        r.setCreatedAt(lv.getCreatedAt());
        return r;
    }
}
