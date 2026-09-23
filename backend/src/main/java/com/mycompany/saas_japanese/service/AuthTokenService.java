package com.mycompany.saas_japanese.service;

import org.springframework.security.oauth2.jwt.Jwt;

import com.mycompany.saas_japanese.domain.User;

public interface AuthTokenService {
  AuthTokens create(User user, boolean rememberMe);

  AuthTokens refresh(String token);

  void revoke(String token);

  boolean isAccessSessionValid(Jwt jwt);
}
