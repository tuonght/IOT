package iot.com.BE.Service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuthenticatedUserService {
    public static final String EMAIL_ATTRIBUTE = AuthenticatedUserService.class.getName() + ".email";

    public String requireEmail(HttpServletRequest request) {
        Object email = request.getAttribute(EMAIL_ATTRIBUTE);
        if (!(email instanceof String value) || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        return value;
    }
}
