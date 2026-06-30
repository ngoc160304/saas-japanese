package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotBlank;
// import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqLoginDTO {
  @NotBlank(message = "email không được để trống")
  private String email;

  @NotBlank(message = "Password không được để trống")
  // @Pattern(regexp =
  // "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&^#()_+\\-=])[A-Za-z\\d@$!%*?&^#()_+\\-=]{8,}$",
  // message = "Password phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và
  // ký tự đặc biệt")
  private String password;
}
