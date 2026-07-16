package com.overnight.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;

@Configuration
public class RestClientConfig {

    /**
     * Uses Spring Boot's auto-configured RestClient.Builder so the application's
     * ObjectMapper (JavaTimeModule, SnakeCaseStrategy, etc.) is registered on this
     * client. Previously called RestClient.builder() (static) which ignored it.
     */
    @Bean
    public RestClient analyticsRestClient(
            @Value("${overnight.analytics.base-url}") String baseUrl,
            RestClient.Builder builder) {
        HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .build();

        return builder                  // <-- injected, NOT RestClient.builder()
            .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .baseUrl(baseUrl)
                .build();
    }
}