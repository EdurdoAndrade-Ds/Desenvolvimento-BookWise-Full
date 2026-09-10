package com.bookwise.infrastructure.web.error;

import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.CategoryNotFoundException;
import com.bookwise.domain.exception.FineNotFoundException;
import com.bookwise.domain.exception.LoanNotFoundException;
import com.bookwise.domain.exception.ReservationNotFoundException;
import com.bookwise.domain.exception.SaleNotFoundException;
import com.bookwise.domain.exception.UserNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Tratamento centralizado de excecoes, produzindo o corpo {@link ApiError}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
        BookNotFoundException.class,
        UserNotFoundException.class,
        LoanNotFoundException.class,
        SaleNotFoundException.class,
        CategoryNotFoundException.class,
        ReservationNotFoundException.class,
        FineNotFoundException.class
    })
    public ResponseEntity<ApiError> handleNotFound(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(BusinessException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleConflict(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "Violacao de integridade de dados (registro duplicado)", request);
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request) {
        ApiError body = ApiError.of(status.value(), status.getReasonPhrase(), message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
