package com.mycompany.saas_japanese.config;

import org.springframework.security.config.Customizer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;

@Configuration
public class SecurityConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // http
        // .csrf(csrf -> csrf.disable())
        // .authorizeHttpRequests(auth -> auth
        // .requestMatchers("/", "/api/v1/auth/login", "/api/v1/auth/register",
        // "/api/v1/auth/verifyUser", "/api/v1/auth/logout",
        // "/api/v1/auth/forgotPassword",
        // "/api/v1/auth/resetPassword", "/api/v1/auth/verifyResetOtp",
        // "/api/v1/auth/refreshToken")
        // .permitAll().anyRequest().authenticated())
        // .oauth2ResourceServer(
        // rs -> rs.jwt(Customizer.withDefaults()))
        // .exceptionHandling(ex -> ex
        // .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
        // .accessDeniedHandler(new BearerTokenAccessDeniedHandler()))
        // .formLogin(form -> form.disable())
        // .sessionManagement(session ->
        // session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/**", "/api/v1/auth/login", "/api/v1/auth/register",
                                "/api/v1/auth/verifyUser", "/api/v1/auth/logout",
                                "/api/v1/auth/forgotPassword",
                                "/api/v1/auth/resetPassword", "/api/v1/auth/verifyResetOtp",
                                "/api/v1/auth/refreshToken", "/api/v1/auth/myProfile")
                        .permitAll().anyRequest().authenticated());
        return http.build();
    }

}
