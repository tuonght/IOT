package iot.com.BE.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import iot.com.BE.Dto.ApiDtos.AuthResponse;
import iot.com.BE.Dto.ApiDtos.ForgotPasswordRequest;
import iot.com.BE.Dto.ApiDtos.LoginRequest;
import iot.com.BE.Dto.ApiDtos.MessageResponse;
import iot.com.BE.Dto.ApiDtos.PasswordChangeRequest;
import iot.com.BE.Dto.ApiDtos.RegisterRequest;
import iot.com.BE.Dto.ApiDtos.ResetPasswordRequest;
import iot.com.BE.Service.AuthService;
import iot.com.BE.Service.PasswordResetService;
import iot.com.BE.Service.SessionAuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final SessionAuthService sessionAuthService;

    public AuthController(
            AuthService authService,
            PasswordResetService passwordResetService,
            SessionAuthService sessionAuthService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.sessionAuthService = sessionAuthService;
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse user = authService.login(request);
        HttpSession previousSession = httpRequest.getSession(false);
        if (previousSession != null) {
            previousSession.invalidate();
        }
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(SessionAuthService.USER_ID_ATTRIBUTE, user.id());
        session.setAttribute(SessionAuthService.USER_EMAIL_ATTRIBUTE, user.email());
        return user;
    }

    @org.springframework.web.bind.annotation.GetMapping("/session")
    public AuthResponse currentSession(HttpSession session) {
        String email = sessionAuthService.requireEmail(session);
        return authService.currentUser(email);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            HttpSession session,
            @Valid @RequestBody PasswordChangeRequest request) {
        authService.changePassword(
                sessionAuthService.requireEmail(session),
                request.currentPassword(),
                request.newPassword());
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
