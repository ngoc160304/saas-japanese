package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SaveJlptAnswerResponse {

    private Long attemptAnswerId;

    private Long attemptId;

    private Long attemptSessionId;

    private Long questionId;

    private Long answerId;

    private Instant answeredAt;
}
