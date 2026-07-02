package com.mycompany.saas_japanese.service;

import java.util.List;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.query.CourseQuerry;
import com.mycompany.saas_japanese.domain.request.ReqCreateCourse;
import com.mycompany.saas_japanese.domain.request.ReqUpdateCourse;
import com.mycompany.saas_japanese.domain.response.CourseResponse;

public interface CourseService {

    Course handleCreateCourse(ReqCreateCourse requetCourse);

    void deleteByIdCourse(long id);

    CourseResponse fetchCourseById(long id);

    Page<CourseResponse> fetchAllCourse(CourseQuerry query);

    CourseResponse updateCourse(Long id, ReqUpdateCourse course);
}
