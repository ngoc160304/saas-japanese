package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Lesson;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.repository.LessonRepository;
import com.mycompany.saas_japanese.repository.MediaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/webhooks")
public class CloudinaryWebhookController {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private MediaRepository mediaRepository;

    @PostMapping("/cloudinary")
    public ResponseEntity<String> handleCloudinaryWebhook(@RequestBody Map<String, Object> payload) {
        try {
            System.out.println("CLOUDINARY WEBHOOK RECEIVED");
            System.out.println("Full payload: " + payload);

            String notificationType = (String) payload.get("notification_type");
            String publicId = (String) payload.get("public_id");

            System.out.println("Notification Type: " + notificationType);
            System.out.println("Public ID: " + publicId);

            if ("upload".equals(notificationType)) {
                Media existingMedia = mediaRepository.findByFileKey(publicId);

                Long lessonId = extractLessonId(publicId, payload);

                if (lessonId != null) {
                    lessonRepository.findById(lessonId).ifPresent(lesson -> {
                        if (existingMedia != null) {
                            lesson.setVideoMediaId(existingMedia.getId());

                            String videoUrl = buildVideoUrl(existingMedia, publicId);
                            lesson.setVideoUrl(videoUrl);
                        }
                        lesson.setStatus("READY");
                        lessonRepository.save(lesson);
                        System.out.println("UPDATED LESSON " + lessonId + " TO READY! URL: " + lesson.getVideoUrl());
                    });
                }

            } else if ("upload_error".equals(notificationType) || "error".equals(notificationType)) {
                Long lessonId = extractLessonId(publicId, payload);
                if (lessonId != null) {
                    lessonRepository.findById(lessonId).ifPresent(lesson -> {
                        lesson.setStatus("FAILED");
                        lessonRepository.save(lesson);
                        System.out.println("===> LESSON " + lessonId + " UPLOAD FAILED!");
                    });
                }
            }
            return ResponseEntity.ok("OK");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    private Long extractLessonId(String publicId, Map<String, Object> payload) {
        try {
            Object context = payload.get("context");
            if (context instanceof Map) {
                Object custom = ((Map<?, ?>) context).get("custom");
                if (custom instanceof Map) {
                    Object lessonIdObj = ((Map<?, ?>) custom).get("lesson_id");
                    if (lessonIdObj != null)
                        return Long.parseLong(lessonIdObj.toString());
                }
            }
            if (publicId != null && publicId.contains("lesson_")) {
                String after = publicId.substring(publicId.indexOf("lesson_") + 7);
                String idStr = after.split("_")[0];
                return Long.parseLong(idStr);
            }
            return Long.parseLong(publicId);

        } catch (Exception e) {
            System.out.println("Không thể extract lessonId từ publicId: " + publicId);
            return null;
        }
    }

    private String buildVideoUrl(Media media, String publicId) {
        String fileKey = (media != null && media.getFileKey() != null) ? media.getFileKey() : publicId;
        return "https://res.cloudinary.com/" + cloudName + "/video/upload/" + fileKey;
    }
}
