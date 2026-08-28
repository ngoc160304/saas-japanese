package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.query.CourseCategoryQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateCourseCategory;
import com.mycompany.saas_japanese.domain.response.CourseCategoryResponse;

public interface CourseCategoryService {

  CourseCategoryResponse create(ReqCreateCourseCategory request);

  Page<CourseCategoryResponse> findAll(CourseCategoryQuery query);

  CourseCategoryResponse findById(Long id);

  CourseCategoryResponse update(Long id, ReqCreateCourseCategory request);

  void delete(Long id);
}
