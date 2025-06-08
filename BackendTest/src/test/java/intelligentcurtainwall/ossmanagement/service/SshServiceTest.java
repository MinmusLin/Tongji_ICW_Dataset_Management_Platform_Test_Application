package intelligentcurtainwall.ossmanagement.service;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.MockedStatic;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SshServiceTest {

    @Mock
    private JSch jsch;

    @Mock
    private Session session;

    @Mock
    private ChannelExec channel;

    @InjectMocks
    private SshService sshService;

    private final String host = "test-host";
    private final int port = 22;
    private final String username = "test-user";
    private final String password = "test-pass";
    private final String command = "test-command";

    @Test
    void executeCommandShouldReturnStreams() throws Exception {
        try (MockedStatic<JSch> mockedJSch = mockStatic(JSch.class)) {
            mockedJSch.when(JSch::new).thenReturn(jsch);

            when(jsch.getSession(username, host, port)).thenReturn(session);
            when(session.openChannel("exec")).thenReturn(channel);
            when(channel.getInputStream()).thenReturn(new ByteArrayInputStream("output".getBytes()));
            when(channel.getErrStream()).thenReturn(new ByteArrayInputStream("error".getBytes()));

            InputStream[] result = sshService.executeCommand(host, port, username, password, command);

            assertNotNull(result);
            assertEquals(2, result.length);
            verify(session).setPassword(password);
            verify(session).setConfig("StrictHostKeyChecking", "no");
            verify(session).connect();
            verify(channel).setCommand(command);
            verify(channel).connect();
        }
    }

    @Test
    void executeCommandShouldThrowExceptionWhenConnectionFails() throws Exception {
        try (MockedStatic<JSch> mockedJSch = mockStatic(JSch.class)) {
            mockedJSch.when(JSch::new).thenReturn(jsch);

            when(jsch.getSession(username, host, port)).thenReturn(session);
            when(session.openChannel("exec")).thenReturn(channel);
            when(channel.getInputStream()).thenReturn(new ByteArrayInputStream("output".getBytes()));
            when(channel.getErrStream()).thenReturn(new ByteArrayInputStream("error".getBytes()));
            doThrow(new RuntimeException("Connection failed")).when(session).connect();

            assertThrows(Exception.class, () -> {
                sshService.executeCommand(host, port, username, password, command);
            });
        }
    }
}