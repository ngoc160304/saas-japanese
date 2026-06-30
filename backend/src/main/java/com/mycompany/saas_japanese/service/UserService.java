package com.mycompany.saas_japanese.service;

import java.util.Optional;

import com.mycompany.saas_japanese.domain.User;

public interface UserService {
  User getUserByEmail(String email);
}
