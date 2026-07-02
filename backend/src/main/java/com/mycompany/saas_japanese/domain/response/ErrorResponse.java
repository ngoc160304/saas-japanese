package com.mycompany.saas_japanese.domain.response;


import java.time.Instant;
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
public class ErrorResponse {
  private int status;
  private String message;
  private String description;
  private String trace;
  @Builder.Default
  private Instant timestamp = Instant.now();

}
