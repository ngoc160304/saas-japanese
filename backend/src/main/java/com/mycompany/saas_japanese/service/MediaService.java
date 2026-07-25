package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.LessonVideo;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.LessonVideoRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class MediaService {

    private final CloudinaryService cloudinaryService;
    private final MediaRepository mediaRepository;
    private final LessonRepository lessonRepository;
    private final LessonVideoRepository lessonVideoRepository;

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    public MediaService(CloudinaryService cloudinaryService,
            MediaRepository mediaRepository,
            LessonRepository lessonRepository,
            LessonVideoRepository lessonVideoRepository) {
        this.cloudinaryService = cloudinaryService;
        this.mediaRepository = mediaRepository;
        this.lessonRepository = lessonRepository;
        this.lessonVideoRepository = lessonVideoRepository;
    }

    @SuppressWarnings("rawtypes")
    public Media uploadAndSaveMedia(MultipartFile file, String type) throws IOException {
        if (file == null || file.isEmpty())
            return null;

        String folderName = "AUDIO".equalsIgnoreCase(type) ? "audios" : "videos";
        Map uploadResult = cloudinaryService.uploadFile(file, folderName, type);

        String publicId = (String) uploadResult.get("public_id");

        Media media = Media.builder()
                .fileKey(publicId)
                .fileName(file.getOriginalFilename())
                .fileType(type.toUpperCase())
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return mediaRepository.save(media);
    }

    @Async
    @SuppressWarnings("rawtypes")
    public CompletableFuture<Media> uploadVideoAsync(File tempFile, String originalFilename, String contentType,
            long fileSize, Long lessonId) {
        try {
            log.info("[ASYNC] Bắt đầu upload video cho lesson {} | thread: {}", lessonId,
                    Thread.currentThread().getName());

            Map uploadResult = cloudinaryService.uploadFile(tempFile, "videos", "VIDEO", lessonId);

            String publicId = (String) uploadResult.get("public_id");
            String secureUrl = (String) uploadResult.get("secure_url");

            Media media = Media.builder()
                    .fileKey(publicId)
                    .fileName(originalFilename)
                    .fileType("VIDEO")
                    .mimeType(contentType)
                    .fileSize(fileSize)
                    .build();

            Media saved = mediaRepository.save(media);
            log.info("[ASYNC] Upload xong, mediaId={}, publicId={}", saved.getId(), publicId);

            int nextOrder = lessonVideoRepository.findByLessonIdOrderBySortOrderAsc(lessonId).size();

            String videoUrl = (secureUrl != null) ? secureUrl
                    : "https://res.cloudinary.com/" + cloudName + "/video/upload/" + publicId;
            LessonVideo lessonVideo = LessonVideo.builder()
                    .lessonId(lessonId)
                    .mediaId(saved.getId())
                    .videoUrl(videoUrl)
                    .title(originalFilename)
                    .sortOrder(nextOrder)
                    .build();
            lessonVideoRepository.save(lessonVideo);

            lessonRepository.findById(lessonId).ifPresent(lesson -> {
                lesson.setStatus("READY");
                lessonRepository.save(lesson);
            });

            log.info("[ASYNC] Đã lưu LessonVideo #{} cho lesson {}", nextOrder, lessonId);
            return CompletableFuture.completedFuture(saved);

        } catch (Exception e) {
            log.error("[ASYNC] Upload FAILED cho lesson {}: {}", lessonId, e.getMessage());
            return CompletableFuture.failedFuture(e);
        } finally {

            if (tempFile != null && tempFile.exists()) {
                boolean deleted = tempFile.delete();
                if (!deleted) {
                    log.warn("Không thể xóa file tạm: {}", tempFile.getAbsolutePath());
                }
            }
        }
    }

    public Media getById(Long id) {
        return mediaRepository.findById(id).orElse(null);
    }
}