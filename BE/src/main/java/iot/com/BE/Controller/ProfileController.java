package iot.com.BE.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpSession;
import iot.com.BE.Dto.ApiDtos.ProfileDto;
import iot.com.BE.Dto.ApiDtos.ProfileUpdateRequest;
import iot.com.BE.Service.ProfileService;
import iot.com.BE.Service.SessionAuthService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profileService;
    private final SessionAuthService sessionAuthService;

    public ProfileController(ProfileService profileService, SessionAuthService sessionAuthService) {
        this.profileService = profileService;
        this.sessionAuthService = sessionAuthService;
    }

    @GetMapping
    public ProfileDto getProfile(HttpSession session) {
        return profileService.get(sessionAuthService.requireEmail(session));
    }

    @PatchMapping
    public ProfileDto updateProfile(
            HttpSession session,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.update(sessionAuthService.requireEmail(session), request);
    }
}
