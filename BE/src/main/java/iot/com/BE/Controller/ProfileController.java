package iot.com.BE.Controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import iot.com.BE.Dto.ApiDtos.ProfileDto;
import iot.com.BE.Dto.ApiDtos.ProfileUpdateRequest;
import iot.com.BE.Service.AuthenticatedUserService;
import iot.com.BE.Service.ProfileService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profileService;
    private final AuthenticatedUserService authenticatedUserService;

    public ProfileController(
            ProfileService profileService,
            AuthenticatedUserService authenticatedUserService) {
        this.profileService = profileService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping
    public ProfileDto getProfile(HttpServletRequest request) {
        return profileService.get(authenticatedUserService.requireEmail(request));
    }

    @PatchMapping
    public ProfileDto updateProfile(
            HttpServletRequest httpRequest,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.update(authenticatedUserService.requireEmail(httpRequest), request);
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfileDto uploadAvatar(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file) {
        return profileService.updateAvatar(authenticatedUserService.requireEmail(request), file);
    }
}
