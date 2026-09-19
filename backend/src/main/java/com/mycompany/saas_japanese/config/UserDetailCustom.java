package com.mycompany.saas_japanese.config;

import java.util.Locale;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Component("userDetailsService")
@RequiredArgsConstructor
public class UserDetailCustom implements UserDetailsService {
  private final UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String email) {
    com.mycompany.saas_japanese.domain.User user = userRepository
        .findByEmail(email.trim().toLowerCase(Locale.ROOT))
        .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
    // Check status after the password in AuthService to avoid disclosing account state.
    return User.withUsername(user.getEmail()).password(user.getPassword()).authorities("ROLE_USER").build();
  }
}
