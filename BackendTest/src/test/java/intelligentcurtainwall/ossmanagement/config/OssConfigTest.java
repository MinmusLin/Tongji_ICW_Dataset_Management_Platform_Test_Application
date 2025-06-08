package intelligentcurtainwall.ossmanagement.config;

import com.aliyun.oss.OSS;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class OssConfigTest {

    @Autowired
    private OssConfig ossConfig;

    @Autowired
    private OSS ossClient;

    @Test
    void ossClientShouldNotBeNull() {
        assertNotNull(ossClient);
    }

    @Test
    void ossClientShouldBeConfiguredCorrectly() {
        OSS client = ossConfig.ossClient();
        assertNotNull(client);
    }
}