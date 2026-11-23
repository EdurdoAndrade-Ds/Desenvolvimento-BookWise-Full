package com.bookwise.domain.port;

import java.net.URI;
import java.io.IOException;

public interface HealthPingClient {
    int get(URI uri) throws IOException, InterruptedException;
}
