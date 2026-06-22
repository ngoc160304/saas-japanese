package com.mycompany.saas_japanese.domain.response;

public class RestResponse<T> {
  private int statusCode;
  private String error;
  // message co the la string hoac arraylist
  private Object message;
  private T data;

  public RestResponse() {

  }

  public int getStatusCode() {
    return statusCode;
  }

  public void setStatusCode(int statusCode) {
    this.statusCode = statusCode;
  }

  public String getError() {
    return error;
  }

  public void setError(String error) {
    this.error = error;
  }

  public Object getMessage() {
    return message;
  }

  public void setMessage(Object message) {
    this.message = message;
  }

  public T getData() {
    return data;
  }

  public void setData(T data) {
    this.data = data;
  }

}
