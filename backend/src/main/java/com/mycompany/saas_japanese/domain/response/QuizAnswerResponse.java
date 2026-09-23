package com.mycompany.saas_japanese.domain.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswerResponse {

    private Boolean correct;

    private Long correctOptionId;

    private String message;
}
