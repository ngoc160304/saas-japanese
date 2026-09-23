package com.mycompany.saas_japanese;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.util.error.ForbiddenException;
import com.mycompany.saas_japanese.util.error.GlobalException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

class ErrorHandlingTest {
  private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new FailureController())
      .setControllerAdvice(new GlobalException()).build();

  @Test
  void authenticationFailuresReturn401() throws Exception {
    mvc.perform(get("/test/unauthenticated")).andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401)).andExpect(jsonPath("$.trace").doesNotExist());
  }

  @Test
  void forbiddenReturns403() throws Exception {
    mvc.perform(get("/test/forbidden")).andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403)).andExpect(jsonPath("$.trace").doesNotExist());
  }

  @Test
  void notFoundReturns404RatherThan400() throws Exception {
    mvc.perform(get("/test/missing")).andExpect(status().isNotFound())
        .andExpect(jsonPath("$.status").value(404)).andExpect(jsonPath("$.trace").doesNotExist());
  }

  @Test
  void unexpectedFailureDoesNotDiscloseExceptionDetails() throws Exception {
    mvc.perform(get("/test/unexpected")).andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.status").value(500))
        .andExpect(jsonPath("$.message").value("Internal server error"))
        .andExpect(jsonPath("$.trace").doesNotExist()).andExpect(jsonPath("$.stackTrace").doesNotExist());
  }

  @RestController
  static class FailureController {
    @GetMapping("/test/unauthenticated")
    public void unauthenticated() {
      throw new BadCredentialsException("Internal authentication diagnostic");
    }

    @GetMapping("/test/forbidden")
    public void forbidden() {
      throw new ForbiddenException("Internal permission diagnostic");
    }

    @GetMapping("/test/missing")
    public void missing() {
      throw new NotFoundException("Not found");
    }

    @GetMapping("/test/unexpected")
    public void unexpected() {
      throw new IllegalStateException("Internal database diagnostic");
    }
  }
}
