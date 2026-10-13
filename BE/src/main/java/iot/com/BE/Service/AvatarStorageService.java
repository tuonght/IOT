package iot.com.BE.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AvatarStorageService {
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Map<String, String> IMAGE_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif");

    private final Path avatarDirectory;

    public AvatarStorageService(
            @Value("${app.profile.avatar-directory:uploads/avatars}") String directory) {
        avatarDirectory = Path.of(directory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa chọn ảnh đại diện.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh đại diện không được lớn hơn 5 MB.");
        }

        String extension = IMAGE_TYPES.get(file.getContentType());
        if (extension == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ ảnh JPG, PNG hoặc GIF.");
        }

        String filename = UUID.randomUUID() + extension;
        try (var imageInput = file.getInputStream()) {
            if (ImageIO.read(imageInput) == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Tệp được chọn không phải ảnh hợp lệ.");
            }
            Files.createDirectories(avatarDirectory);
            try (var fileInput = file.getInputStream()) {
                Files.copy(fileInput, avatarDirectory.resolve(filename));
            }
            return filename;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu ảnh đại diện.", exception);
        }
    }

}
