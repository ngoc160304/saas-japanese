package com.mycompany.saas_japanese.domain.response;

import java.util.List;

import com.mycompany.saas_japanese.util.constant.JlptSessionEnum;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JlptExamSessionResponse {

    private Long id;

    private String name;

    private JlptSessionEnum sessionType;

    private Integer timeLimitMinutes;

    private Integer sortOrder;

    private Integer questionCount;

    private List<JlptExamPartResponse> parts;
}