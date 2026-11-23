package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.KeepAliveRequest;
import com.bookwise.application.dto.KeepAliveResponse;
import com.bookwise.application.service.KeepAliveService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/keep-alive")
public class KeepAliveController {
    private final KeepAliveService service;

    public KeepAliveController(KeepAliveService service) {
        this.service = service;
    }

    @GetMapping
    public KeepAliveResponse get() {
        return service.get();
    }

    @PutMapping
    public KeepAliveResponse update(@Valid @RequestBody KeepAliveRequest request) {
        return service.update(request);
    }
}
