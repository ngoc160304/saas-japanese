package com.mycompany.saas_japanese.domain.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqOtpDTO {
  private String otp;
  private String email;
}
