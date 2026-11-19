package com.bookwise.domain.port;

import com.bookwise.domain.model.KeepAliveConfig;

public interface KeepAliveRepository {
    KeepAliveConfig load();
    KeepAliveConfig save(KeepAliveConfig config);
}
