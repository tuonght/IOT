package iot.com.BE.Service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

@Service
public class SessionAuthService {
    public static final String USER_ID_ATTRIBUTE = "iot.userId";
    public static final String USER_EMAIL_ATTRIBUTE = "iot.userEmail";

    public String requireEmail(HttpSession session) {
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        Object email = session.getAttribute(USER_EMAIL_ATTRIBUTE);
        if (!(email instanceof String value) || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        return value;
    }
}
