package intelligentcurtainwall.ossmanagement.controller;

import intelligentcurtainwall.ossmanagement.service.SshService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeploymentLogsControllerTest {

    @Mock
    private SshService sshService;

    @InjectMocks
    private DeploymentLogsController controller;

    private final String testProperties = "host=test-host\nport=22\nusername=test-user\npassword=test-pass";
    private final String testLogContent = "2023-01-01 10:00:00 - Deployment started\n2023-01-01 10:05:00 - Deployment completed";

    @BeforeEach
    void setUp() throws Exception {
        try (MockedStatic<ClassPathResource> mockedResource = mockStatic(ClassPathResource.class)) {
            InputStream propertiesStream = new ByteArrayInputStream(testProperties.getBytes());
            when(controller.getClass().getResourceAsStream("/ssh-config.properties")).thenReturn(propertiesStream);
        }
    }

    @Test
    void getDeploymentLogsShouldReturnLogContent() throws Exception {
        String lsCommand = "ls -t /home/mat/Intelligent_Curtain_Wall/deployment-logs/*.txt | head -n 1";
        String catCommand = "cat log.txt";

        InputStream[] lsStreams = new InputStream[]{
            new ByteArrayInputStream("log.txt".getBytes()),
            new ByteArrayInputStream("".getBytes())
        };

        InputStream[] catStreams = new InputStream[]{
            new ByteArrayInputStream(testLogContent.getBytes()),
            new ByteArrayInputStream("".getBytes())
        };

        when(sshService.executeCommand(anyString(), anyInt(), anyString(), anyString(), eq(lsCommand)))
            .thenReturn(lsStreams);
        when(sshService.executeCommand(anyString(), anyInt(), anyString(), anyString(), eq(catCommand)))
            .thenReturn(catStreams);

        String result = controller.getDeploymentLogs();
        assertTrue(result.contains("Deployment started"));
        assertTrue(result.contains("Deployment completed"));
    }

    @Test
    void getDeploymentLogsShouldHandleNoLogFile() throws Exception {
        String lsCommand = "ls -t /home/mat/Intelligent_Curtain_Wall/deployment-logs/*.txt | head -n 1";

        InputStream[] lsStreams = new InputStream[]{
            new ByteArrayInputStream("".getBytes()),
            new ByteArrayInputStream("".getBytes())
        };

        when(sshService.executeCommand(anyString(), anyInt(), anyString(), anyString(), eq(lsCommand)))
            .thenReturn(lsStreams);

        String result = controller.getDeploymentLogs();
        assertEquals("No log file found.", result);
    }

    @Test
    void getDeploymentLogsShouldHandleSshError() throws Exception {
        String lsCommand = "ls -t /home/mat/Intelligent_Curtain_Wall/deployment-logs/*.txt | head -n 1";

        InputStream[] lsStreams = new InputStream[]{
            new ByteArrayInputStream("".getBytes()),
            new ByteArrayInputStream("Permission denied".getBytes())
        };

        when(sshService.executeCommand(anyString(), anyInt(), anyString(), anyString(), eq(lsCommand)))
            .thenReturn(lsStreams);

        String result = controller.getDeploymentLogs();
        assertTrue(result.startsWith("Error: Permission denied"));
    }

    @Test
    void executeSSHCommandShouldHandleIOException() throws Exception {
        InputStream[] streams = new InputStream[]{
            new ByteArrayInputStream("test".getBytes()),
            new ByteArrayInputStream("".getBytes())
        };
        when(sshService.executeCommand(anyString(), anyInt(), anyString(), anyString(), anyString()))
            .thenReturn(streams);

        String result = controller.executeSSHCommand("test-command");
        assertNotNull(result);
    }

    @Test
    void constructorShouldLoadProperties() {
        assertDoesNotThrow(() -> new DeploymentLogsController(sshService));
        assertEquals("test-host", controller.sshConfig.getProperty("host"));
        assertEquals("22", controller.sshConfig.getProperty("port"));
        assertEquals("test-user", controller.sshConfig.getProperty("username"));
        assertEquals("test-pass", controller.sshConfig.getProperty("password"));
    }
}