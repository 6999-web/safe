package com.whitehat.platform.common;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ApiResponse<Void>> business(BusinessException e) { return ResponseEntity.badRequest().body(new ApiResponse<>(400, e.getMessage(), null)); }
    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ApiResponse<Void>> conflict(ConflictException e) { return ResponseEntity.status(409).body(new ApiResponse<>(409, e.getMessage(), null)); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> validation(MethodArgumentNotValidException e) {
        String msg=e.getBindingResult().getFieldErrors().stream().map(x->x.getField()+": "+x.getDefaultMessage()).collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(new ApiResponse<>(400,msg,null));
    }
    @ExceptionHandler(DuplicateKeyException.class)
    ResponseEntity<ApiResponse<Void>> duplicate() { return ResponseEntity.status(409).body(new ApiResponse<>(409,"数据已存在，请勿重复提交",null)); }
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiResponse<Void>> denied() { return ResponseEntity.status(403).body(new ApiResponse<>(403,"无权执行此操作",null)); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> unknown(Exception e) { return ResponseEntity.status(500).body(new ApiResponse<>(500,"服务器内部错误",null)); }
}
