package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotNull;

public record ReqQuizPublication(@NotNull Boolean isPublished) {
}
