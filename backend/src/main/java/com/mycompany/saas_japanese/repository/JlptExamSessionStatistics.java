package com.mycompany.saas_japanese.repository;

public interface JlptExamSessionStatistics {
  Long getExamId();
  long getSessionCount();
  long getTotalTimeMinutes();
}
