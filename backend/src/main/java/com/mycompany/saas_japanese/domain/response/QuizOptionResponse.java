package com.mycompany.saas_japanese.domain.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizOptionResponse {

    private Long id;

    private String optionText;

    private Integer sortOrder;
}
