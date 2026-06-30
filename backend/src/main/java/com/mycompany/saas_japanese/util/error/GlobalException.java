package com.mycompany.saas_japanese.util.error;

import java.io.PrintWriter;
import java.io.StringWriter;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.mycompany.saas_japanese.domain.response.ErrorResponse;

// them stack trace
@RestControllerAdvice
public class GlobalException {
    @ExceptionHandler(value = BadRequestException.class)
    public ResponseEntity<ErrorResponse> BadRequestException(BadRequestException idException) {
        ErrorResponse response = new ErrorResponse();
        response.setMessage(idException.getMessage());
        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.setTrace(getStackTrace(idException));
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(value = ForbiddenException.class)
    public ResponseEntity<ErrorResponse> ForbiddenException(ForbiddenException idException) {
        ErrorResponse response = new ErrorResponse();
        response.setMessage(idException.getMessage());
        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.setTrace(getStackTrace(idException));
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(Exception.class) // fallback for all exceptions
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ErrorResponse response = new ErrorResponse();
        response.setMessage("Internal Server Error");
        response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.setTrace(getStackTrace(ex));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private String getStackTrace(Exception ex) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        ex.printStackTrace(pw);
        return sw.toString();
    }
}
