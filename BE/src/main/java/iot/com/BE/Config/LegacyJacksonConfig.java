package iot.com.BE.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class LegacyJacksonConfig {

    @Bean
    ObjectMapper mqttObjectMapper() {
        return new ObjectMapper();
    }
}
