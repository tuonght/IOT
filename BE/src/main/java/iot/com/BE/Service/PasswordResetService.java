package iot.com.BE.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import iot.com.BE.Entity.PasswordResetToken;
import iot.com.BE.Entity.User;
import iot.com.BE.Repository.PasswordResetTokenRepository;
import iot.com.BE.Repository.UserRepository;

@Service
public class PasswordResetService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    private static final int TOKEN_LIFETIME_MINUTES = 30;

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenders;
    private final String mailFrom;
    private final String frontendUrl;

    public PasswordResetService(
            UserRepository users,
            PasswordResetTokenRepository tokens,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSenders,
            @Value("${app.mail.from:}") String mailFrom,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.users = users;
        this.tokens = tokens;
        this.passwordEncoder = passwordEncoder;
        this.mailSenders = mailSenders;
        this.mailFrom = mailFrom;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public void sendResetEmail(String emailAddress) {
        JavaMailSender mailSender = mailSenders.getIfAvailable();
        if (mailSender == null || mailFrom.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ email chưa được cấu hình. Hãy cấu hình MAIL_HOST và MAIL_FROM.");
        }

        String email = emailAddress.trim().toLowerCase();
        User user = users.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            return;
        }

        byte[] randomToken = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(randomToken);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomToken);

        tokens.deleteAllByEmail(email);
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setEmail(email);
        resetToken.setTokenHash(sha256(rawToken));
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(TOKEN_LIFETIME_MINUTES));
        tokens.save(resetToken);

        String resetLink = frontendUrl.replaceAll("/+$", "")
                + "/reset-password?token=" + rawToken;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setFrom(mailFrom);
            helper.setTo(user.getEmail());
            helper.setSubject("Đặt lại mật khẩu IoT Control");
            helper.setText(
                    "Bạn vừa yêu cầu đặt lại mật khẩu.\n\n"
                    + "Mở liên kết sau để chọn mật khẩu mới (có hiệu lực trong 30 phút):\n"
                    + resetLink
                    + "\n\nNếu bạn không yêu cầu thao tác này, hãy bỏ qua email.",
                    false);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Không gửi được email đặt lại mật khẩu. Vui lòng thử lại sau.");
        }
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = tokens.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));
        if (!token.getExpiresAt().isAfter(LocalDateTime.now())) {
            tokens.delete(token);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }

        User user = users.findByEmailIgnoreCase(token.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Tài khoản không còn tồn tại."));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        users.save(user);
        tokens.deleteAllByEmail(token.getEmail());
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }
}
