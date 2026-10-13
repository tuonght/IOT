package iot.com.BE.Config;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
    private final JwtAuthInterceptor jwtAuthInterceptor;

    public WebConfig(JwtAuthInterceptor jwtAuthInterceptor) {
        this.jwtAuthInterceptor = jwtAuthInterceptor;
    }

    @Bean
    WebMvcConfigurer corsConfigurer(
            @Value("${app.web.allowed-origin:http://localhost:5173}") String allowedOrigin,
            @Value("${app.profile.avatar-directory:uploads/avatars}") String avatarDirectory) {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(allowedOrigin)
                        .allowedMethods("GET", "POST", "PATCH", "OPTIONS")
                        .allowedHeaders("Content-Type", "Authorization");
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                String location = Path.of(avatarDirectory).toAbsolutePath().normalize()
                        .toUri().toString();
                if (!location.endsWith("/")) {
                    location += "/";
                }
                registry.addResourceHandler("/uploads/**")
                        .addResourceLocations(location)
                        .setCachePeriod(31_536_000);
            }

            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(jwtAuthInterceptor)
                        .addPathPatterns("/api/**")
                        .excludePathPatterns(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/logout");
            }
        };
    }
}
