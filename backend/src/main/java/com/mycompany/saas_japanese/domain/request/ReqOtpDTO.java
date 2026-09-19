package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqOtpDTO {
  @NotBlank
  @Pattern(regexp = "[0-9]{6}")
  private String otp;

  @NotBlank
  @Email
  @Size(max = 254)
  private String email;
}
