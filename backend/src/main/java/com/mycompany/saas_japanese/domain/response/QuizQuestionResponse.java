package com.mycompany.saas_japanese.domain.response;


import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestionResponse {

    private Long id;

    private String questionText;

    private String questionType;

    private Integer sortOrder;

    private List<QuizOptionResponse> options;
}
