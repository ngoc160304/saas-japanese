package com.mycompany.saas_japanese.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.Cart;
import com.mycompany.saas_japanese.domain.CartItem;
import com.mycompany.saas_japanese.domain.Course;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.response.CartResponse;
import com.mycompany.saas_japanese.repository.CartItemRepository;
import com.mycompany.saas_japanese.repository.CartRepository;
import com.mycompany.saas_japanese.repository.CourseEnrollmentRepository;
import com.mycompany.saas_japanese.repository.CourseRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.CartService;
import com.mycompany.saas_japanese.service.mapper.CartMapper;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;


@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor 
@Service
public class CartServiceImpl implements CartService{
    
    CartRepository cartRepository;

    CartItemRepository cartItemRepository;

    CourseRepository courseRepository;

    CourseEnrollmentRepository courseEnrollmentRepository;

    UserRepository userRepository;

    CartMapper cartMapper;


    @Override
    public CartResponse addToCart(Long userId, Long courseId){
        // String email = SecurityUtil
        //     .getCurrentUserLogin()
        //     .orElseThrow(
        //         () -> new BadRequestException(
        //             "Người dùng chưa đăng nhập"));

        User user = userRepository
            // .findByEmail(email)
            .findById(userId)
            .orElseThrow(
                () -> new NotFoundException(
                    "Người dùng không tồn tại"));
        
        Course course = courseRepository
            .findByIdAndIsDeletedFalse(courseId)
            .orElseThrow(
                () -> new NotFoundException(
                    "Course không tồn tại"));

        if(!Boolean.TRUE.equals(course.getIsPublished())){
            throw new BadRequestException(
                "Course chưa được công khai");}

        if(course.getPrice() == null 
            || course.getPrice().compareTo(BigDecimal.ZERO) == 0)
            throw new BadRequestException(
                "Chương trình học miễn phí không cần thêm vào giỏ hàng");

        boolean isEnrolled = courseEnrollmentRepository
            .existsByUserIdAndCourseId(
                user.getId(),
                course.getId());
        
        if(isEnrolled){
            throw new BadRequestException(
                "Bạn đã đăng ký course này");}
                
        Cart cart = cartRepository
            .findByUserId(userId)
            .orElseGet(()-> {
                Cart newCart = new Cart();
                newCart.setUser(user);
                return cartRepository.save(newCart);
            });

        boolean exits = cartItemRepository
            .existsByCartIdAndCourseId(
                cart.getId(),
                course.getId());

        if(exits){
            throw new BadRequestException(
            "Chương trình học đã có trong giỏ hàng");}

        CartItem cartItem = new CartItem();

        cartItem.setCart(cart);
        cartItem.setCourse(course);
        cartItemRepository.save(cartItem);
        List<CartItem> cartItems = cartItemRepository
                .findByCartId(cart.getId());
        
        return cartMapper.toResponse(cart, cartItems);
    }

    @Override 
    public void deleteCartItem(Long userId, Long Id){
        
        CartItem cartItem = cartItemRepository
            .findByIdAndCartUserId(Id,userId)
            .orElseThrow(()->new NotFoundException(
                "Không tìm thấy sản phẩm trong giỏ hàng"));
            
        cartItemRepository.delete(cartItem);
        }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public CartResponse getDetailCart(Long userId){
        userRepository
            .findById(userId)
            .orElseThrow(
                () -> new NotFoundException(
                    "Người dùng không tồn tại"));

        Cart cart = cartRepository
            .findByUserId(userId)
            .orElse(null);

        if(cart == null){
            CartResponse response = new CartResponse();

            response.setId(null);
            response.setItems(List.of());
            response.setTotalAmount(BigDecimal.ZERO);

            return response;
        }

        List<CartItem> cartItems = cartItemRepository
            .findByCartId(cart.getId());

        return cartMapper.toResponse(cart, cartItems);
    }
}
