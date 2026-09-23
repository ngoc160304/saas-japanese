package com.mycompany.saas_japanese.domain.response;

import java.util.List;

import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JlptExamDetailResponse {

    private Long id;

    private String title;

    private JlptLevelEnum jlptLevel;

    private String description;

    private int totalTimeMinutes;

    private Boolean isPublished;

    private List<JlptExamSessionResponse> sessions;
}