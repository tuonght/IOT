package iot.com.BE.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iot.com.BE.Dto.ApiDtos.ProfileDto;
import iot.com.BE.Dto.ApiDtos.ProfileUpdateRequest;
import iot.com.BE.Entity.User;
import iot.com.BE.Repository.UserRepository;

@Service
public class ProfileService {
    private final AuthService authService;
    private final UserRepository users;

    public ProfileService(AuthService authService, UserRepository users) {
        this.authService = authService;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public ProfileDto get(String email) {
        return toDto(authService.findUser(email));
    }

    @Transactional
    public ProfileDto update(String email, ProfileUpdateRequest request) {
        User user = authService.findUser(email);
        if (request.username() != null && !request.username().isBlank()) {
            user.setUsername(request.username().trim());
        }
        if (request.email() != null && !request.email().isBlank()) {
            String updatedEmail = request.email().trim().toLowerCase();
            if (!updatedEmail.equalsIgnoreCase(user.getEmail())
                    && users.existsByEmailIgnoreCase(updatedEmail)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.CONFLICT, "Email đã được sử dụng.");
            }
            user.setEmail(updatedEmail);
        }
        if (request.studentId() != null) user.setStudentCode(request.studentId());
        if (request.className() != null) user.setClassName(request.className());
        if (request.github() != null) user.setGithubLink(request.github());
        if (request.pdfLink() != null) user.setPdfLink(request.pdfLink());
        if (request.apiDocs() != null) user.setPostmanLink(request.apiDocs());
        if (request.figma() != null) user.setFigmaLink(request.figma());
        if (request.avatar() != null) user.setAvatarUrl(request.avatar());
        return toDto(users.save(user));
    }

    private ProfileDto toDto(User user) {
        return new ProfileDto(
                user.getUsername(),
                user.getEmail(),
                user.getStudentCode(),
                user.getClassName(),
                user.getGithubLink(),
                user.getPdfLink(),
                user.getPostmanLink(),
                user.getFigmaLink(),
                user.getAvatarUrl());
    }
}
