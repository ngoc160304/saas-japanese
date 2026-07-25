package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.service.LessonService;
import com.mycompany.saas_japanese.service.MediaService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;
import com.mycompany.saas_japanese.domain.request.ReqCreateLesson;
import com.mycompany.saas_japanese.domain.request.ReqUpdateLesson;
import com.mycompany.saas_japanese.domain.response.LessonResponse;
import com.mycompany.saas_japanese.repository.LessonVideoRepository;
import com.mycompany.saas_japanese.service.mapper.LessonMapper;
import jakarta.validation.Valid;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/lessons")
@Slf4j
public class LessonController {
    @Autowired
    private LessonService service;

    @Autowired
    private MediaService mediaService;

    @Autowired
    private LessonVideoRepository lessonVideoRepository;

    @Autowired
    private LessonMapper lessonMapper;

    @GetMapping
    @ApiMessage("Get all lessons")
    public ResponseEntity<List<LessonResponse>> getAll() {
        return ResponseEntity.ok(service.getAll().stream().map(lessonMapper::toResponse).toList());
    }

    @GetMapping("/course/{courseId}")
    @ApiMessage("Get lessons by course")
    public ResponseEntity<List<LessonResponse>> getByCourse(@PathVariable("courseId") Long courseId) {
        return ResponseEntity.ok(service.getByCourse(courseId).stream().map(lessonMapper::toResponse).toList());
    }

    @GetMapping("/{id}")
    @ApiMessage("Get lesson by ID")
    public ResponseEntity<LessonResponse> getById(@PathVariable("id") Long id) {
        Lesson data = service.getById(id);
        return data != null ? ResponseEntity.ok(lessonMapper.toResponse(data)) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @ApiMessage("Create new lesson")
    public ResponseEntity<LessonResponse> create(@Valid @RequestBody ReqCreateLesson request) {
        Lesson entity = lessonMapper.toEntity(request);
        Lesson savedLesson = service.create(entity);
        return ResponseEntity.ok(lessonMapper.toResponse(savedLesson));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update lesson")
    public ResponseEntity<LessonResponse> update(@PathVariable("id") Long id,
            @Valid @RequestBody ReqUpdateLesson request) {
        Lesson lesson = service.getById(id);
        if (lesson == null)
            return ResponseEntity.notFound().build();
        lessonMapper.updateEntity(lesson, request);
        Lesson updated = service.update(id, lesson);
        return ResponseEntity.ok(lessonMapper.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete lesson")
    public ResponseEntity<Map<String, String>> delete(@PathVariable("id") Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Success"));
    }

    @GetMapping("/course/{courseId}/public")
    @ApiMessage("Get published lessons by course")
    public ResponseEntity<List<LessonResponse>> getPublicLessonsByCourse(@PathVariable("courseId") Long courseId) {
        return ResponseEntity
                .ok(service.getPublishedLessonsByCourse(courseId).stream().map(lessonMapper::toResponse).toList());
    }

    // id lesson
    @PostMapping(value = "/{id}/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ApiMessage("Upload video for lesson")
    public ResponseEntity<?> uploadVideo(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file) {

        Map<String, Object> response = new HashMap<>();

        Lesson lesson = service.getById(id);
        if (lesson == null) {
            return ResponseEntity.notFound().build();
        }

        if (file == null || file.isEmpty()) {
            response.put("error", "File video is empty or invalid.");
            return ResponseEntity.badRequest().body(response);
        }
        File tempFile;
        try {
            Path tempFilePath = Files.createTempFile("upload_", "_" + file.getOriginalFilename());
            tempFile = tempFilePath.toFile();
            file.transferTo(tempFile);
        } catch (IOException e) {
            log.error("Không thể tạo file tạm để upload video", e);
            response.put("error", "Error preparing video file for upload.");
            return ResponseEntity.internalServerError().body(response);
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        long fileSize = tempFile.length();

        lesson.setStatus("PROCESSING");
        service.update(id, lesson);

        mediaService.uploadVideoAsync(tempFile, originalFilename, contentType, fileSize, id)
                .exceptionally(ex -> {
                    Lesson failed = service.getById(id);
                    if (failed != null) {
                        failed.setStatus("FAILED");
                        service.update(id, failed);
                    }
                    log.error("[ASYNC] Upload failed lesson {}: {}", id, ex.getMessage());
                    return null;
                });

        response.put("message", "Video is being uploaded in background.");
        response.put("lessonId", id);
        response.put("status", "PROCESSING");
        response.put("checkStatus", "GET /api/v1/lessons/" + id);
        return ResponseEntity.accepted().body(response);
    }

    @DeleteMapping("/{id}/videos/{videoId}")
    @ApiMessage("Delete a specific video from lesson")
    public ResponseEntity<Map<String, String>> deleteVideo(
            @PathVariable("id") Long lessonId,
            @PathVariable("videoId") Long videoId) {
        return lessonVideoRepository.findById(videoId)
                .filter(v -> v.getLessonId().equals(lessonId))
                .map(v -> {
                    lessonVideoRepository.delete(v);
                    return ResponseEntity.ok(Map.of("message", "Video deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}