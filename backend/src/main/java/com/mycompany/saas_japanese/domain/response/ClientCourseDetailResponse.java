package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClientCourseDetailResponse extends ClientCourseResponse {
    private Instant updatedAt;
    private Long totalDurationMinutes;
}
