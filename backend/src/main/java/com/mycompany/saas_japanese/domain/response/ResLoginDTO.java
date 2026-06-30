package com.mycompany.saas_japanese.domain.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
public class ResLoginDTO {
  @JsonProperty("access_token")
  private String accessToken;
  private String refreshToen;
  private UserLogin user;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UserLogin {
    private String email;
    private String name;
    private Long id;
  }

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UserGetAccount {
    private UserLogin user;
  }
}
