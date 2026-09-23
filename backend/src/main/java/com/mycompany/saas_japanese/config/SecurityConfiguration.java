package com.mycompany.saas_japanese.config;

import java.util.Set;

import jakarta.servlet.DispatcherType;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;

import com.mycompany.saas_japanese.util.error.SecurityErrorHandler;

@Configuration
public class SecurityConfiguration {
    private static final Set<String> COOKIE_AUTH_PATHS = Set.of(
            "/api/v1/auth/csrf", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/verify-user",
            "/api/v1/auth/refresh-token", "/api/v1/auth/logout");

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder passwords) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(passwords);
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder,
            JwtAuthenticationConverter converter, SecurityErrorHandler errors,
            @Value("${AUTH_COOKIE_SECURE:true}") boolean secure) throws Exception {
        CookieCsrfTokenRepository csrfCookies = new CookieCsrfTokenRepository();
        csrfCookies.setCookieCustomizer(cookie -> cookie.httpOnly(true).secure(secure).sameSite("Lax").path("/"));
        DefaultBearerTokenResolver bearerTokens = new DefaultBearerTokenResolver();
        http
                .cors(cors -> {
                })
                .csrf(csrf -> csrf.csrfTokenRepository(csrfCookies)
                        .requireCsrfProtectionMatcher(request -> CsrfFilter.DEFAULT_CSRF_MATCHER.matches(request)
                                && request.getRequestURI().substring(request.getContextPath().length())
                                        .startsWith("/api/v1/auth/")))
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/v1/auth/forgot-password", "/api/v1/auth/verify-reset-otp",
                                "/api/v1/auth/reset-password")
                        .denyAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/csrf").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/register",
                                "/api/v1/auth/verify-user", "/api/v1/auth/refresh-token", "/api/v1/auth/logout")
                        .permitAll()
                        .requestMatchers("/api/v1/auth/myProfile", "/api/v1/auth/updateProfile").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/lessons").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/lessons/**").authenticated()
                        // User has no persisted admin role yet. Do not manufacture administrative
                        // authority.
                        .requestMatchers(HttpMethod.POST, "/api/v1/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/**").permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html")
                        .permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(resource -> resource
                        // Cookie-auth endpoints must not inherit the resource server's Bearer CSRF
                        // exemption.
                        // Ignoring stale access headers here also lets refresh/logout work after access
                        // expiry.
                        .bearerTokenResolver(request -> {
                            String path = request.getRequestURI().substring(request.getContextPath().length());
                            return COOKIE_AUTH_PATHS.contains(path) ? null : bearerTokens.resolve(request);
                        })
                        .jwt(jwt -> jwt.decoder(jwtDecoder).jwtAuthenticationConverter(converter))
                        .authenticationEntryPoint(errors).accessDeniedHandler(errors))
                .exceptionHandling(
                        exceptions -> exceptions.authenticationEntryPoint(errors).accessDeniedHandler(errors))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable);
        return http.build();
    }
}
