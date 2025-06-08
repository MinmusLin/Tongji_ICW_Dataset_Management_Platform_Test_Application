package intelligentcurtainwall.ossmanagement.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class WebConfigTest {

    @Autowired
    private WebConfig webConfig;

    @Test
    void testCorsConfiguration() {
        CorsRegistry registry = new CorsRegistry();
        webConfig.addCorsMappings(registry);

        assertTrue(registry.getCorsConfigurations().containsKey("/**"));
    }

    @Test
    void testWebConfigImplementsWebMvcConfigurer() {
        assertTrue(webConfig instanceof WebMvcConfigurer);
    }
}