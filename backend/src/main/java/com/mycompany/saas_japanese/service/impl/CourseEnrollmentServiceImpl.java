package com.mycompany.saas_japanese.service.impl;

import com.mycompany.saas_japanese.service.CartService;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.CourseEnrollment;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.query.CourseEnrollmentQuery;
import com.mycompany.saas_japanese.domain.response.CourseEnrollmentResponse;
import com.mycompany.saas_japanese.repository.CourseEnrollmentRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.CourseEnrollmentService;
import com.mycompany.saas_japanese.service.mapper.CourseEnrollmentMapper;
import com.mycompany.saas_japanese.specification.CourseEnrolmentSpecs;
import com.mycompany.saas_japanese.util.SecurityUtil;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor 
@Service 
@Transactional 
public class CourseEnrollmentServiceImpl implements CourseEnrollmentService{
    

    CourseEnrollmentRepository courseEnrollmentRepository;

    CourseRepository courseRepository;

    UserRepository userRepository;

    CourseEnrollmentMapper courseEnrollmentMapper;

    CartService cartService;


    @Override
    public CourseEnrollmentResponse enroll(Long courseId){

        User user = getCurrentUser();
        
        Course course = courseRepository
            .findByIdAndIsDeletedFalse(courseId)
            .orElseThrow(
                () -> new NotFoundException(
                    "Course không tồn tại"));

        if(!Boolean.TRUE.equals(course.getIsPublished())){
            throw new BadRequestException(
                "Course chưa được công khai");}

        boolean isEnrolled = courseEnrollmentRepository
            .existsByUserIdAndCourseId(
                user.getId(),
                course.getId());
        
        if(isEnrolled){
            throw new BadRequestException(
                "Bạn đã đăng ký course này");}

        if(course.getPrice().compareTo(BigDecimal.ZERO) == 0){

            CourseEnrollment enrollment = new CourseEnrollment();

            enrollment.setUser(user);

            enrollment.setCourse(course);

            enrollment.setProgressPercent(BigDecimal.ZERO);

            CourseEnrollment saveEnrollment = courseEnrollmentRepository.save(enrollment);

            return courseEnrollmentMapper.toResponse(saveEnrollment);
        }else{
            cartService.addToCart(courseId);
            return null;
        }
    }

    @Override
    @Transactional
    public CourseEnrollmentResponse createEnrollmentAfterPayment(
            Long userId,
            Long courseId) {

        User user = userRepository.findById(userId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Người dùng không tồn tại"));

        Course course = courseRepository
                .findByIdAndIsDeletedFalse(courseId)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Chương trình học không tồn tại"));

        var existingEnrollment = courseEnrollmentRepository
                .findByUserIdAndCourseId(userId, courseId);

        if (existingEnrollment.isPresent()) {
            return courseEnrollmentMapper.toResponse(
                    existingEnrollment.get());
        }

        CourseEnrollment enrollment = new CourseEnrollment();

        enrollment.setUser(user);
        enrollment.setCourse(course);

        CourseEnrollment saved =
                courseEnrollmentRepository.save(enrollment);

        return courseEnrollmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public Page<CourseEnrollmentResponse> getMyCourses(CourseEnrollmentQuery query){

        User user = getCurrentUser();
        PredicateSpecification<CourseEnrollment> spec = CourseEnrolmentSpecs.hasUserId(user.getId());

        if (query.getCourseTitle() != null && !query.getCourseTitle().trim().isEmpty()) {
            spec = spec.and(
                CourseEnrolmentSpecs.hasCourseTitle(
                    query.getCourseTitle().trim()));
        }

        // 4. Truy vấn phân trang
        Page<CourseEnrollment> enrollmentPage = courseEnrollmentRepository.findBy(
            spec,
            q -> q.page(
                PageRequest.of(
                    query.getPage(),
                    query.getSize())));

        return enrollmentPage.map(courseEnrollmentMapper::toResponse);
    }

    private User getCurrentUser() {

        String email = SecurityUtil
                .getCurrentUserLogin()
                .orElseThrow(
                        () -> new BadRequestException(
                                "Người dùng chưa đăng nhập"));

        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Người dùng không tồn tại"));
    }
}
