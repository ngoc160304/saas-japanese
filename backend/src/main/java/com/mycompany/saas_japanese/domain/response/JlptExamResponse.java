package com.mycompany.saas_japanese.domain.response;

import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@AllArgsConstructor 
@NoArgsConstructor 
@Builder 
public class JlptExamResponse {
 
    private Long id;

    private String title;
    
    private JlptLevelEnum jlptLevel;

    private String description;

    private int totalTimeMinutes;

    private Boolean isPublished;
}
