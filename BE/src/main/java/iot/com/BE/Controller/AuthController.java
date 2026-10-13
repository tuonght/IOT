package iot.com.BE.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import iot.com.BE.Dto.ApiDtos.AuthResponse;
import iot.com.BE.Dto.ApiDtos.ForgotPasswordRequest;
import iot.com.BE.Dto.ApiDtos.LoginRequest;
import iot.com.BE.Dto.ApiDtos.LoginResponse;
import iot.com.BE.Dto.ApiDtos.MessageResponse;
import iot.com.BE.Dto.ApiDtos.PasswordChangeRequest;
import iot.com.BE.Dto.ApiDtos.RegisterRequest;
import iot.com.BE.Dto.ApiDtos.ResetPasswordRequest;
import iot.com.BE.Service.AuthenticatedUserService;
import iot.com.BE.Service.AuthService;
import iot.com.BE.Service.JwtTokenService;
import iot.com.BE.Service.PasswordResetService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final AuthenticatedUserService authenticatedUserService;
    private final JwtTokenService jwtTokenService;

    public AuthController(
            AuthService authService,
            PasswordResetService passwordResetService,
            AuthenticatedUserService authenticatedUserService,
            JwtTokenService jwtTokenService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.authenticatedUserService = authenticatedUserService;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        AuthResponse user = authService.login(request);
        return new LoginResponse(
                user.id(), user.email(), user.username(), jwtTokenService.createToken(user.email()));
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public AuthResponse currentUser(HttpServletRequest request) {
        String email = authenticatedUserService.requireEmail(request);
        return authService.currentUser(email);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout() {
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            HttpServletRequest httpRequest,
            @Valid @RequestBody PasswordChangeRequest passwordRequest) {
        authService.changePassword(
                authenticatedUserService.requireEmail(httpRequest),
                passwordRequest.currentPassword(),
                passwordRequest.newPassword(),
                passwordRequest.confirmPassword());
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.sendResetEmail(request.email());
        return new MessageResponse(
                "Nếu email được đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi tới hộp thư.");
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
    }
}
