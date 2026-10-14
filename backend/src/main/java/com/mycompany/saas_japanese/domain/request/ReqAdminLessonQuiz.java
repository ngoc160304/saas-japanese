package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReqAdminLessonQuiz(
    @NotBlank @Size(max = 200) String title,
    @NotNull @Size(max = 500) String description) {
}
