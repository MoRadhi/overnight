package com.overnight.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class OvernightBackendApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the Spring context wires up cleanly - entities, repos,
        // security config, and CORS config all load without errors.
    }
}
