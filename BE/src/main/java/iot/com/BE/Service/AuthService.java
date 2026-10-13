package iot.com.BE.Service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import iot.com.BE.Dto.ApiDtos.AuthResponse;
import iot.com.BE.Dto.ApiDtos.LoginRequest;
import iot.com.BE.Dto.ApiDtos.RegisterRequest;
import iot.com.BE.Entity.User;
import iot.com.BE.Repository.UserRepository;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email này chưa được đăng ký."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Mật khẩu không đúng.");
        }
        return toResponse(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được đăng ký.");
        }
        User user = new User();
        user.setEmail(email);
        user.setUsername(request.username().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        return toResponse(users.save(user));
    }

    @Transactional
    public void changePassword(
            String email, String currentPassword, String newPassword, String confirmPassword) {
        User user = findUser(email);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng.");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Mật khẩu xác nhận không khớp.");
        }
        if (newPassword.length() < 6 || newPassword.length() > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Mật khẩu mới phải có từ 6 đến 72 ký tự.");
        }
        if (currentPassword.equals(newPassword)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        users.save(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse currentUser(String email) {
        return toResponse(findUser(email));
    }

    @Transactional(readOnly = true)
    public User findUser(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại.");
        }
        return users.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại."));
    }

    private AuthResponse toResponse(User user) {
        return new AuthResponse(user.getId(), user.getEmail(), user.getUsername());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
