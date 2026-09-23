package com.mycompany.saas_japanese.domain.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResponse {

    private Long id;

    private String title;

    private String description;

    private List<QuizQuestionResponse> questions;
}
