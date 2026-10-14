package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReqSpeakingTopic(
    @NotBlank @Size(max = 150) String title,
    @NotBlank @Size(max = 1000) String description) {
}

