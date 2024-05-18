package net.caltona.simplefinance.api;

import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
@AllArgsConstructor
public class ExceptionControllerAdvice {

    @ExceptionHandler(BadConfigException.class)
    public ResponseEntity<String> badConfig(BadConfigException badConfigException) {
        return new ResponseEntity<>(badConfigException.getMessage(), HttpStatus.BAD_REQUEST);
    }

    public static class BadConfigException extends RuntimeException {

        public BadConfigException(String message) {
            super(message);
        }
    }

}
