package com.mycompany.saas_japanese.domain.response;

import lombok.*;

@Getter
@Setter
public class MediaResponse {
  private Long id;

  private String originalName;

  private String publicId;

  private String secureUrl;
}
