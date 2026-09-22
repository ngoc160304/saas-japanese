package com.mycompany.saas_japanese.domain.response;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JlptExamPartResponse {

    private Long id;

    private String name;

    private String instructions;

    private Integer sortOrder;

    private Long audioMediaId;

    private Integer questionCount;
}