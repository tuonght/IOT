package iot.com.BE.Config;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import iot.com.BE.Service.SessionAuthService;

@Component
public class AuthSessionInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        var session = request.getSession(false);
        if (session != null
                && session.getAttribute(SessionAuthService.USER_EMAIL_ATTRIBUTE) instanceof String email
                && !email.isBlank()) {
            return true;
        }

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\":\"Vui lòng đăng nhập.\"}");
        return false;
    }
}
