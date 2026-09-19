package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.request.ReqForgotPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.request.ReqRegisterDTO;
import com.mycompany.saas_japanese.domain.request.ReqResetPasswordDTO;
import com.mycompany.saas_japanese.domain.response.ResRegisterDTO;

public interface AuthService {
  ResRegisterDTO register(ReqRegisterDTO request);

  String verifyUser(ReqOtpDTO request);

  AuthTokens login(ReqLoginDTO request);

  void logout(String refreshToken);

  AuthTokens refreshToken(String refreshToken);

  void forgotPassword(ReqForgotPasswordDTO request);

  void resetPassword(ReqResetPasswordDTO request);

  void verifyResetOtp(ReqOtpDTO request);
}
