package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqForgotPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.request.ReqResetPasswordDTO;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;

import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {
  User register(User user);

  String verifyUser(ReqOtpDTO otp);

  ResLoginDTO login(ReqLoginDTO reqLoginDTO);

  void logout(HttpServletResponse response);

  void forgotPassword(ReqForgotPasswordDTO req);

  void resetPassword(ReqResetPasswordDTO req);

}
