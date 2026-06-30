package com.mycompany.saas_japanese.config;

import java.util.Collections;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
// import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.service.UserService;
import com.mycompany.saas_japanese.util.error.BadRequestException;

@Component("userDetailsService")
public class UserDetailCustom implements UserDetailsService {
  UserService userService;

  public UserDetailCustom(UserService userService) {
    this.userService = userService;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws BadRequestException {
    com.mycompany.saas_japanese.domain.User user = this.userService.getUserByEmail(username);
    if (user == null) {
      throw new BadRequestException("username/password khong hop le !");
    }
    return new User(
        user.getEmail(),
        user.getPassword(),
        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
  }

}
