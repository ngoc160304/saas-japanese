package com.mycompany.saas_japanese.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RestResponse<T> {
  private int statusCode;
  private String error;
  // message co the la string hoac arraylist
  private Object message;
  private T data;
}
