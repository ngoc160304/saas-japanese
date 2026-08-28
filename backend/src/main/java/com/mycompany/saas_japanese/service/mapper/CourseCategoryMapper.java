package com.mycompany.saas_japanese.service.mapper;

import com.mycompany.saas_japanese.domain.CourseCategory;
import com.mycompany.saas_japanese.domain.response.CourseCategoryResponse;

import org.springframework.stereotype.Component;

@Component
public class CourseCategoryMapper {

  public CourseCategoryResponse toResponse(
      CourseCategory category) {

    return CourseCategoryResponse.builder()
        .id(category.getId())
        .name(category.getName())
        .slug(category.getSlug())
        .description(category.getDescription())
        .mediaId(
            category.getMedia() != null
                ? category.getMedia().getId()
                : null)
        .mediaUrl(
            category.getMedia() != null
                ? category.getMedia().getSecureUrl()
                : null)
        .createdAt(category.getCreatedAt())
        .updatedAt(category.getUpdatedAt())
        .build();
  }
}
