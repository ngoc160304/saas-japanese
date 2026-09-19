package com.mycompany.saas_japanese.domain.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ResLoginDTO(
    @JsonProperty("access_token") String accessToken,
    String tokenType,
    long expiresIn,
    UserLogin user) {

  public record UserLogin(String email, String name, Long id) {
  }
}
