package com.bookwise.infrastructure.config;

import com.bookwise.domain.port.HealthPingClient;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.stereotype.Component;

@Component
public class JdkHealthPingClient implements HealthPingClient {
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build();

    public int get(URI uri) throws IOException, InterruptedException {
        var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(4)).GET().build();
        return client.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
    }
}
