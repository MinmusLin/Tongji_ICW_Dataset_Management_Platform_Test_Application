package intelligentcurtainwall.ossmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthenticationControllerTest {

    private AuthenticationController authenticationController;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String testJson = "[{\"UserName\":\"user1\",\"Password\":\"pass1\",\"AccessKeyId\":\"key1\",\"AccessKeySecret\":\"secret1\"}]";

    @BeforeEach
    void setUp() throws IOException {
        try (MockedStatic<ClassPathResource> mockedResource = mockStatic(ClassPathResource.class)) {
            ClassPathResource mockResource = mock(ClassPathResource.class);
            when(mockResource.getInputStream()).thenReturn(new ByteArrayInputStream(testJson.getBytes()));
            mockedResource.when(() -> new ClassPathResource("oss-config.json")).thenReturn(mockResource);

            authenticationController = new AuthenticationController();
        }
    }

    @Test
    void authenticateShouldReturnCredentialsForValidUser() {
        AuthenticationController.AuthenticationRequest request =
            new AuthenticationController.AuthenticationRequest("user1", "pass1");

        AuthenticationController.AuthenticationResponse response =
            authenticationController.authenticate(request);

        assertEquals("key1", response.accessKeyId());
        assertEquals("secret1", response.accessKeySecret());
    }

    @Test
    void authenticateShouldReturnEmptyCredentialsForInvalidUser() {
        AuthenticationController.AuthenticationRequest request =
            new AuthenticationController.AuthenticationRequest("wrong", "wrong");

        AuthenticationController.AuthenticationResponse response =
            authenticationController.authenticate(request);

        assertEquals("", response.accessKeyId());
        assertEquals("", response.accessKeySecret());
    }

    @Test
    void constructorShouldHandleIOException() throws IOException {
        try (MockedStatic<ClassPathResource> mockedResource = mockStatic(ClassPathResource.class)) {
            ClassPathResource mockResource = mock(ClassPathResource.class);
            when(mockResource.getInputStream()).thenThrow(new IOException("Test error"));
            mockedResource.when(() -> new ClassPathResource("oss-config.json")).thenReturn(mockResource);

            assertThrows(IOException.class, () -> new AuthenticationController());
        }
    }

    @Test
    void userCredentialsShouldHaveCorrectProperties() {
        AuthenticationController.UserCredentials credentials = new AuthenticationController.UserCredentials();
        credentials.userName = "testUser";
        credentials.password = "testPass";
        credentials.accessKeyId = "testKey";
        credentials.accessKeySecret = "testSecret";

        assertEquals("testUser", credentials.getUserName());
        assertEquals("testPass", credentials.getPassword());
        assertEquals("testKey", credentials.getAccessKeyId());
        assertEquals("testSecret", credentials.getAccessKeySecret());
    }
}