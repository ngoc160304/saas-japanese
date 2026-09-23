package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
    int status, String message, Map<String, String> fieldErrors, Instant timestamp) {

  public ErrorResponse {
    fieldErrors = Map.copyOf(fieldErrors);
  }

  public static ErrorResponse of(int status, String message) {
    return new ErrorResponse(status, message, Map.of(), Instant.now());
  }
}
