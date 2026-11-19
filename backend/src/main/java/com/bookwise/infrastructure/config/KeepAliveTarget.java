package com.bookwise.infrastructure.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class KeepAliveTarget {
    private final URI healthUri;

    public KeepAliveTarget(@Value("${BOOKWISE_PUBLIC_URL:}") String publicUrl,
            @Value("${RENDER_EXTERNAL_URL:}") String renderUrl) {
        String base = (publicUrl.isBlank() ? renderUrl : publicUrl).trim().replaceAll("/+$", "");
        URI candidate = null;
        try {
            URI uri = URI.create(base + "/actuator/health");
            if (("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                    && uri.getHost() != null && uri.getUserInfo() == null
                    && uri.getQuery() == null && uri.getFragment() == null) {
                candidate = uri;
            }
        } catch (IllegalArgumentException ignored) {
        }
        healthUri = candidate;
    }

    public URI healthUri() {
        return healthUri;
    }
}
