package com.mycompany.saas_japanese.service;

import java.time.Instant;

import com.mycompany.saas_japanese.domain.response.ResLoginDTO;

/** Internal service result. Only response() is serialized by the HTTP controller. */
public record AuthTokens(ResLoginDTO response, String refreshToken, Instant refreshExpiresAt, boolean persistent) {
  @Override
  public String toString() {
    return "AuthTokens[redacted]";
  }
}
