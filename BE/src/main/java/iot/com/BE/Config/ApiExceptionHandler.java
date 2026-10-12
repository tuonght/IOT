package iot.com.BE.Config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import iot.com.BE.Dto.ApiDtos.MessageResponse;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<MessageResponse> handleResponseStatusException(
            ResponseStatusException exception) {
        String message = exception.getReason() == null
                ? "Yêu cầu không thể thực hiện."
                : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode())
                .body(new MessageResponse(message));
    }
}
