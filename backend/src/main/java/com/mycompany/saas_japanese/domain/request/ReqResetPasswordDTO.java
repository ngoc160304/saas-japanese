package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqResetPasswordDTO {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;
    @NotBlank(message = "OTP không được để trống")
    private String otp;
    @NotBlank(message = "Mật khẩu mới không được để trống")
    private String newPassword;
}
