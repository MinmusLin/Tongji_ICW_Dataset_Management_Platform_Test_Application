package intelligentcurtainwall.ossmanagement.controller;

import intelligentcurtainwall.ossmanagement.service.OssService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OssControllerTest {

    @Mock
    private OssService ossService;

    @Mock
    private AuthenticationController authenticationController;

    @InjectMocks
    private OssController ossController;

    private final String testBucket = "test-bucket";
    private final String testUserName = "test-user";
    private final String testPassword = "test-pass";
    private final String testObjectKey = "test-user/test-path/test-file.txt";
    private final byte[] testFileContent = "test content".getBytes();
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        ossController.bucket = testBucket;
        request = new MockHttpServletRequest();
        request.setContextPath("");
    }

    @Test
    void downloadFileShouldReturnFileContent() {
        String path = "/oss/download/" + testObjectKey;
        request.setRequestURI(path);

        when(ossService.getObject(testBucket, testObjectKey)).thenReturn(testFileContent);

        ResponseEntity<byte[]> response = ossController.downloadFile(request);

        assertEquals(200, response.getStatusCodeValue());
        assertArrayEquals(testFileContent, response.getBody());
        assertTrue(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION)
                .contains("test-file.txt"));
    }

    @Test
    void downloadFileShouldReturnNotFoundForMissingFile() {
        String path = "/oss/download/missing-file.txt";
        request.setRequestURI(path);

        when(ossService.getObject(testBucket, "missing-file.txt")).thenReturn(null);

        ResponseEntity<byte[]> response = ossController.downloadFile(request);

        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void uploadFileShouldReturnDownloadUrl() throws IOException {
        String path = "/oss/upload/test-path/test-file.txt";
        request.setRequestURI(path);
        MultipartFile file = new MockMultipartFile("file", "test-file.txt", "text/plain", testFileContent);

        when(authenticationController.authenticate(any()))
            .thenReturn(new AuthenticationController.AuthenticationResponse("key", "secret"));
        when(ossService.putObject(testBucket, testObjectKey, file))
            .thenReturn(testObjectKey);

        ResponseEntity<String> response = ossController.uploadFile(
            file, testUserName, testPassword, request);

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().contains(testObjectKey));
    }

    @Test
    void uploadFileShouldRejectInvalidCredentials() {
        String path = "/oss/upload/test-path/test-file.txt";
        request.setRequestURI(path);
        MultipartFile file = new MockMultipartFile("file", "test-file.txt", "text/plain", testFileContent);

        when(authenticationController.authenticate(any()))
            .thenReturn(new AuthenticationController.AuthenticationResponse("", ""));

        ResponseEntity<String> response = ossController.uploadFile(
            file, testUserName, "wrong-pass", request);

        assertEquals(401, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("Authentication failed"));
    }

    @Test
    void uploadFileShouldRejectInvalidObjectKey() {
        String path = "/oss/upload/invalid@path/test-file.txt";
        request.setRequestURI(path);
        MultipartFile file = new MockMultipartFile("file", "test-file.txt", "text/plain", testFileContent);

        when(authenticationController.authenticate(any()))
            .thenReturn(new AuthenticationController.AuthenticationResponse("key", "secret"));

        ResponseEntity<String> response = ossController.uploadFile(
            file, testUserName, testPassword, request);

        assertEquals(400, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("Invalid object key format"));
    }

    @Test
    void uploadFileShouldHandleIOException() throws IOException {
        String path = "/oss/upload/test-path/test-file.txt";
        request.setRequestURI(path);
        MultipartFile file = new MockMultipartFile("file", "test-file.txt", "text/plain", testFileContent);

        when(authenticationController.authenticate(any()))
            .thenReturn(new AuthenticationController.AuthenticationResponse("key", "secret"));
        when(ossService.putObject(testBucket, testObjectKey, file))
            .thenThrow(new IOException("OSS error"));

        ResponseEntity<String> response = ossController.uploadFile(
            file, testUserName, testPassword, request);

        assertEquals(500, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("File upload failed"));
    }

    @Test
    void isValidObjectKeyShouldValidateCorrectly() {
        assertTrue(ossController.isValidObjectKey("valid-path/valid-file.txt"));
        assertTrue(ossController.isValidObjectKey("valid123/456-file.txt"));
        assertTrue(ossController.isValidObjectKey("valid-path/valid.file.txt"));

        assertFalse(ossController.isValidObjectKey("invalid@path/file.txt"));
        assertFalse(ossController.isValidObjectKey("valid-path/invalid@file.txt"));
        assertFalse(ossController.isValidObjectKey("valid-path/"));
        assertFalse(ossController.isValidObjectKey(null));
        assertFalse(ossController.isValidObjectKey(""));
    }
}