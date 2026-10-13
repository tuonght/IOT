package iot.com.BE.Dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ApiDtos {
    private ApiDtos() {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(max = 100) String username,
            @NotBlank @Size(min = 6, max = 72) String password) {
    }

    public record AuthResponse(Long id, String email, String username) {
    }

    public record LoginResponse(Long id, String email, String username, String token) {
    }

    public record PasswordChangeRequest(
            @NotBlank String currentPassword,
            @NotBlank String newPassword,
            @NotBlank String confirmPassword) {
    }

    public record ForgotPasswordRequest(@NotBlank @Email String email) {
    }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 6, max = 72) String newPassword) {
    }

    public record MessageResponse(String message) {
    }

    public record ProfileDto(
            String username,
            String email,
            String studentId,
            String className,
            String github,
            String pdfLink,
            String apiDocs,
            String figma,
            String avatar) {
    }

    public record ProfileUpdateRequest(
            @Size(max = 100) String username,
            @Email String email,
            @Size(max = 50) String studentId,
            @Size(max = 50) String className,
            @Size(max = 255) String github,
            @Size(max = 255) String pdfLink,
            @Size(max = 255) String apiDocs,
            @Size(max = 255) String figma,
            @Size(max = 255) String avatar) {
    }

    public record SensorLatestDto(
            BigDecimal temperature,
            BigDecimal humidity,
            BigDecimal light,
            LocalDateTime updatedAt) {
    }

    public record ChartPointDto(
            LocalDateTime time,
            BigDecimal temperature,
            BigDecimal humidity,
            BigDecimal light) {
    }

    public record DeviceDto(Long id, String code, String name, String status) {
    }

    public record DeviceStatusUpdateDto(
            Long id, String status, Boolean commandSucceeded, String commandAction) {
    }

    public record DeviceActionRequest(@NotBlank String action) {
    }

    public record SensorDataDto(Long id, String type, String value, LocalDateTime time) {
    }

    public record HistoryDto(
            Long id,
            String device,
            String performedBy,
            String action,
            String status,
            LocalDateTime time) {
    }

    public record PagedResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages) {
    }
}
