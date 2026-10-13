package iot.com.BE.Config;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import iot.com.BE.Service.AuthenticatedUserService;
import iot.com.BE.Service.JwtTokenService;

@Component
public class JwtAuthInterceptor implements HandlerInterceptor {
    private final JwtTokenService jwtTokenService;

    public JwtAuthInterceptor(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = authorization.substring(7).trim();
            try {
                request.setAttribute(
                        AuthenticatedUserService.EMAIL_ATTRIBUTE,
                        jwtTokenService.getSubject(token));
                return true;
            } catch (org.springframework.web.server.ResponseStatusException exception) {
                writeUnauthorized(response, exception.getReason());
                return false;
            }
        }

        if (authorization == null || authorization.isBlank()) {
            writeUnauthorized(response, "Vui lòng đăng nhập bằng Bearer token.");
            return false;
        }

        writeUnauthorized(response, "Vui lòng đăng nhập bằng Bearer token.");
        return false;
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
