package com.mycompany.saas_japanese.domain.request;

import java.nio.charset.StandardCharsets;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqLoginDTO {
  @NotBlank
  @Email
  @Size(max = 254)
  private String email;

  @NotBlank
  @Size(max = 72)
  private String password;

  private boolean rememberMe;

  @JsonIgnore
  @AssertTrue(message = "Password must not exceed 72 UTF-8 bytes")
  public boolean isPasswordWithinByteLimit() {
    return password == null || password.getBytes(StandardCharsets.UTF_8).length <= 72;
  }
}
