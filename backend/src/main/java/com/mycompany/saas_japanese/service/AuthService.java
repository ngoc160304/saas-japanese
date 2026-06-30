package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;

public interface AuthService {
  User register(User user);

  String verifyUser(ReqOtpDTO otp);

  ResLoginDTO login(ReqLoginDTO reqLoginDTO);

}
