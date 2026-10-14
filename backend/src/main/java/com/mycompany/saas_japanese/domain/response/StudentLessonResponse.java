package com.mycompany.saas_japanese.domain.response;

public record StudentLessonResponse(
    Long id, Long courseId, String title, String slug, String grammar,
    Integer durationMinutes, String videoUrl) {
}
