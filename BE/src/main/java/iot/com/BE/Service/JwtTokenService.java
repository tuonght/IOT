package iot.com.BE.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class JwtTokenService {
    private static final String SIGNATURE_ALGORITHM = "HmacSHA256";
    private static final String UNAUTHORIZED_MESSAGE = "Token đăng nhập không hợp lệ hoặc đã hết hạn.";

    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final long expirationSeconds;

    public JwtTokenService(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-seconds:86400}") long expirationSeconds) {
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < 32) {
            throw new IllegalArgumentException("JWT secret must contain at least 32 bytes.");
        }
        if (expirationSeconds <= 0) {
            throw new IllegalArgumentException("JWT expiration must be greater than zero.");
        }
        this.expirationSeconds = expirationSeconds;
    }

    public String createToken(String email) {
        long issuedAt = Instant.now().getEpochSecond();
        String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
        String payload = encodeJson(Map.of(
                "sub", email,
                "iat", issuedAt,
                "exp", issuedAt + expirationSeconds));
        String unsignedToken = header + "." + payload;
        return unsignedToken + "." + Base64.getUrlEncoder().withoutPadding()
                .encodeToString(sign(unsignedToken));
    }

    public String getSubject(String token) {
        try {
            String[] parts = token.split("\\.", -1);
            if (parts.length != 3) {
                throw unauthorized();
            }

            JsonNode header = objectMapper.readTree(decode(parts[0]));
            if (!"HS256".equals(header.path("alg").asText())) {
                throw unauthorized();
            }

            byte[] providedSignature = Base64.getUrlDecoder().decode(parts[2]);
            byte[] expectedSignature = sign(parts[0] + "." + parts[1]);
            if (!MessageDigest.isEqual(expectedSignature, providedSignature)) {
                throw unauthorized();
            }

            JsonNode claims = objectMapper.readTree(decode(parts[1]));
            String subject = claims.path("sub").asText("");
            JsonNode expiration = claims.get("exp");
            if (subject.isBlank()
                    || expiration == null
                    || !expiration.canConvertToLong()
                    || expiration.asLong() <= Instant.now().getEpochSecond()) {
                throw unauthorized();
            }
            return subject;
        } catch (IOException | IllegalArgumentException exception) {
            throw unauthorized();
        }
    }

    private String encodeJson(Map<String, ?> value) {
        try {
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (IOException exception) {
            throw new IllegalStateException("Could not encode JWT.", exception);
        }
    }

    private byte[] decode(String value) {
        return Base64.getUrlDecoder().decode(value);
    }

    private byte[] sign(String value) {
        try {
            Mac mac = Mac.getInstance(SIGNATURE_ALGORITHM);
            mac.init(new SecretKeySpec(secret, SIGNATURE_ALGORITHM));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 is unavailable.", exception);
        }
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
    }
}
