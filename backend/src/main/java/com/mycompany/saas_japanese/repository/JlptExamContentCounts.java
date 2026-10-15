package com.mycompany.saas_japanese.repository;

public interface JlptExamContentCounts {
  Long getExamId();
  long getPartCount();
  long getQuestionCount();
}
