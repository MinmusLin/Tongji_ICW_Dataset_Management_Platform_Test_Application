package intelligentcurtainwall.ossmanagement.controller;

import intelligentcurtainwall.ossmanagement.service.SshService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DockerLogsControllerTest {

    @Mock
    private SshService sshService;

    @InjectMocks
    private DockerLogsController controller;

    private final String testProperties = "host=test-host\nport=22\nusername=test-user\npassword=test-pass";
    private final String containerId = "test-container";

    @BeforeEach
    void setUp() throws IOException {
        InputStream propertiesStream = new ByteArrayInputStream(testProperties.getBytes());
        when(controller.getClass().getResourceAsStream("/ssh-config.properties")).thenReturn(propertiesStream);
    }

    @Test
    void streamDockerLogsShouldReturnSseEmitter() throws Exception {
        InputStream[] testStreams = new InputStream[]{
            new ByteArrayInputStream("log line 1\nlog line 2".getBytes()),
            new ByteArrayInputStream("error line".getBytes())
        };

        when(sshService.executeCommand(anyString(), anyInt(), anyString(), anyString(), anyString()))
            .thenReturn(testStreams);

        SseEmitter emitter = controller.streamDockerLogs(containerId);
        assertNotNull(emitter);

        // Allow time for async processing
        Thread.sleep(100);

        verify(sshService).executeCommand(
            eq("test-host"),
            eq(22),
            eq("test-user"),
            eq("test-pass"),
            contains("docker logs -f " + containerId)
        );
    }

    @Test
    void streamDockerLogsShouldHandleSshError() throws Exception {
        when(sshService.executeCommand(anyString(), anyInt(), anyString(), anyString(), anyString()))
            .thenThrow(new RuntimeException("SSH error"));

        SseEmitter emitter = controller.streamDockerLogs(containerId);
        assertNotNull(emitter);

        // Allow time for async processing
        Thread.sleep(100);

        assertTrue(emitter.isCompleted());
    }

    @Test
    void createStreamHandlerShouldSendLinesToEmitter() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        InputStream stream = new ByteArrayInputStream("line1\nline2".getBytes());

        Thread handler = controller.createStreamHandler(stream, emitter);
        handler.start();
        handler.join();

        verify(emitter, times(2)).send(anyString(), eq(MediaType.TEXT_PLAIN));
    }

    @Test
    void createStreamHandlerShouldHandleIOException() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        InputStream stream = mock(InputStream.class);
        when(stream.read(any(byte[].class))).thenThrow(new IOException("Test error"));

        Thread handler = controller.createStreamHandler(stream, emitter);
        handler.start();
        handler.join();

        verify(emitter).send(contains("Error:"), eq(MediaType.TEXT_PLAIN));
    }

    @Test
    void constructorShouldLoadProperties() {
        assertDoesNotThrow(() -> new DockerLogsController(sshService));
        assertEquals("test-host", controller.sshConfig.getProperty("host"));
        assertEquals("22", controller.sshConfig.getProperty("port"));
        assertEquals("test-user", controller.sshConfig.getProperty("username"));
        assertEquals("test-pass", controller.sshConfig.getProperty("password"));
    }
}