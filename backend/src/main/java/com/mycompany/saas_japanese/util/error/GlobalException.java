package com.mycompany.saas_japanese.util.error;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.validation.ConstraintViolationException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.mycompany.saas_japanese.domain.response.ErrorResponse;

@RestControllerAdvice
public class GlobalException {
  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<ErrorResponse> badRequest(BadRequestException exception) {
    return error(HttpStatus.BAD_REQUEST, exception.getMessage());
  }

  @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
  public ResponseEntity<ErrorResponse> forbidden(Exception exception) {
    return error(HttpStatus.FORBIDDEN, "Access denied");
  }

  @ExceptionHandler({AuthenticationException.class, JwtException.class})
  public ResponseEntity<ErrorResponse> unauthenticated(Exception exception) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).header("WWW-Authenticate", "Bearer")
        .body(ErrorResponse.of(401, "Invalid credentials or token"));
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ErrorResponse> notFound(NotFoundException exception) {
    return error(HttpStatus.NOT_FOUND, exception.getMessage());
  }

  @ExceptionHandler({ConflictException.class, DataIntegrityViolationException.class})
  public ResponseEntity<ErrorResponse> conflict(Exception exception) {
    return error(HttpStatus.CONFLICT, "Resource already exists or conflicts with current data");
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException exception) {
    Map<String, String> fields = new LinkedHashMap<>();
    exception.getBindingResult().getFieldErrors().forEach(field ->
        fields.putIfAbsent(field.getField(), field.getDefaultMessage() == null ? "Invalid value"
            : field.getDefaultMessage()));
    return ResponseEntity.badRequest().body(new ErrorResponse(400, "Validation failed", fields, Instant.now()));
  }

  @ExceptionHandler({HttpMessageNotReadableException.class, ConstraintViolationException.class})
  public ResponseEntity<ErrorResponse> invalidRequest(Exception exception) {
    return error(HttpStatus.BAD_REQUEST, "Invalid request");
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ErrorResponse> invalidMethod(HttpRequestMethodNotSupportedException exception) {
    return error(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed");
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ErrorResponse> invalidMediaType(HttpMediaTypeNotSupportedException exception) {
    return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported media type");
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ErrorResponse> missingResource(NoResourceFoundException exception) {
    return error(HttpStatus.NOT_FOUND, "Resource not found");
  }

  @ExceptionHandler(ServiceUnavailableException.class)
  public ResponseEntity<ErrorResponse> unavailable(ServiceUnavailableException exception) {
    return error(HttpStatus.SERVICE_UNAVAILABLE, "Service temporarily unavailable");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> unexpected(Exception exception) {
    return error(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
  }

  private ResponseEntity<ErrorResponse> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(ErrorResponse.of(status.value(), message));
  }
}
