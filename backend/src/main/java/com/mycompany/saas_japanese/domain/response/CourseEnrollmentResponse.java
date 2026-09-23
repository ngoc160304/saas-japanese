package com.mycompany.saas_japanese.domain.response;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
public class CourseEnrollmentResponse {

    private Long Id;

    private Long userId;

    private Long courseId;

    private BigDecimal progressPercent;

    private Instant enrollAt;
    
    private Instant completedAt;

    private String courseTitle;


}
