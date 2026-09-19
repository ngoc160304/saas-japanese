package com.mycompany.saas_japanese.config;

import java.io.IOException;
import java.io.InputStream;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.Resource;
import org.springframework.security.converter.RsaKeyConverters;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import com.mycompany.saas_japanese.service.AuthTokenService;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;

@Configuration
public class SecurityJwtConfiguration {
  @Bean
  @Primary
  public JwtDecoder jwtDecoder(RSAPublicKey publicKey, AuthTokenService sessions,
      @Value("${AUTH_JWT_ISSUER:saas-japanese}") String issuer) {
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(publicKey).build();
    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(validator("access", issuer),
        jwt -> sessions.isAccessSessionValid(jwt) ? OAuth2TokenValidatorResult.success() : invalidToken()));
    return decoder;
  }

  @Bean
  public JwtDecoder refreshJwtDecoder(RSAPublicKey publicKey,
      @Value("${AUTH_JWT_ISSUER:saas-japanese}") String issuer) {
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(publicKey).build();
    decoder.setJwtValidator(validator("refresh", issuer));
    return decoder;
  }

  private OAuth2TokenValidator<Jwt> validator(String type, String issuer) {
    OAuth2TokenValidator<Jwt> claims = jwt -> {
      boolean valid = type.equals(jwt.getClaimAsString("token_use"))
          && jwt.getAudience() != null && jwt.getAudience().contains("saas-japanese-" + type)
          && jwt.getExpiresAt() != null && jwt.getIssuedAt() != null
          && jwt.getSubject() != null && !jwt.getSubject().isBlank()
          && jwt.getId() != null && !jwt.getId().isBlank()
          && jwt.getClaimAsString("sid") != null && !jwt.getClaimAsString("sid").isBlank();
      return valid ? OAuth2TokenValidatorResult.success() : invalidToken();
    };
    return new DelegatingOAuth2TokenValidator<>(
        new JwtTimestampValidator(Duration.ZERO), new JwtIssuerValidator(issuer), claims);
  }

  private OAuth2TokenValidatorResult invalidToken() {
    return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Invalid or expired token", null));
  }

  @Bean
  public JwtEncoder jwtEncoder(RSAPublicKey publicKey, RSAPrivateKey privateKey) {
    RSAKey key = new RSAKey.Builder(publicKey).privateKey(privateKey).build();
    return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(key)));
  }

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
    authorities.setAuthorityPrefix("");
    authorities.setAuthoritiesClaimName("permission");
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(authorities);
    return converter;
  }

  @Bean
  public RSAPrivateKey privateKey(@Value("${jwt.private-key}") Resource resource) {
    try (InputStream input = resource.getInputStream()) {
      return Objects.requireNonNull(RsaKeyConverters.pkcs8().convert(input), "Invalid private key");
    } catch (IOException ex) {
      throw new IllegalStateException("Cannot load JWT private key");
    }
  }

  @Bean
  public RSAPublicKey publicKey(@Value("${jwt.public-key}") Resource resource) {
    try (InputStream input = resource.getInputStream()) {
      return Objects.requireNonNull(RsaKeyConverters.x509().convert(input), "Invalid public key");
    } catch (IOException ex) {
      throw new IllegalStateException("Cannot load JWT public key");
    }
  }
}
