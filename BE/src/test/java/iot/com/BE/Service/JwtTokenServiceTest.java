package iot.com.BE.Service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;

class JwtTokenServiceTest {
    private static final String SECRET = "test-secret-with-at-least-32-bytes";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final JwtTokenService tokenService =
            new JwtTokenService(objectMapper, SECRET, 3600);

    @Test
    void returnsSubjectFromValidToken() {
        String token = tokenService.createToken("user@example.com");

        assertEquals("user@example.com", tokenService.getSubject(token));
    }

    @Test
    void rejectsTokenWithModifiedClaims() throws Exception {
        String[] parts = tokenService.createToken("user@example.com").split("\\.");
        String modifiedClaims = Base64.getUrlEncoder().withoutPadding().encodeToString(
                objectMapper.writeValueAsBytes(Map.of(
                        "sub", "attacker@example.com",
                        "iat", Instant.now().getEpochSecond(),
                        "exp", Instant.now().plusSeconds(3600).getEpochSecond())));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> tokenService.getSubject(parts[0] + "." + modifiedClaims + "." + parts[2]));

        assertEquals(401, exception.getStatusCode().value());
    }

    @Test
    void rejectsMalformedToken() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> tokenService.getSubject("not-a-jwt"));

        assertEquals(401, exception.getStatusCode().value());
    }
}
