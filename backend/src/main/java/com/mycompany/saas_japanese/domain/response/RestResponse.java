package com.mycompany.saas_japanese.domain.response;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RestResponse<T> {
  private int statusCode;
  private String error;
  // message co the la string hoac arraylist
  private Object message;
  private T data;
}
