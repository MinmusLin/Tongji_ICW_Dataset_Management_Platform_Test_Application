package intelligentcurtainwall.ossmanagement.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.GetObjectRequest;
import com.aliyun.oss.model.OSSObject;
import com.aliyun.oss.model.PutObjectRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OssServiceTest {

    @Mock
    private OSS ossClient;

    @Mock
    private MultipartFile multipartFile;

    @InjectMocks
    private OssService ossService;

    private final String testBucket = "test-bucket";
    private final String testKey = "test-key";
    private final byte[] testData = "test data".getBytes();

    @BeforeEach
    void setUp() throws IOException {
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream(testData));
    }

    @Test
    void getObjectShouldReturnCorrectData() throws IOException {
        OSSObject mockOssObject = mock(OSSObject.class);
        when(ossClient.getObject(any(GetObjectRequest.class))).thenReturn(mockOssObject);
        when(mockOssObject.getObjectContent()).thenReturn(new ByteArrayInputStream(testData));

        byte[] result = ossService.getObject(testBucket, testKey);
        assertArrayEquals(testData, result);
        verify(ossClient).getObject(any(GetObjectRequest.class));
    }

    @Test
    void putObjectShouldReturnObjectKey() throws IOException {
        when(ossClient.putObject(any(PutObjectRequest.class))).thenReturn(null);

        String result = ossService.putObject(testBucket, testKey, multipartFile);
        assertEquals(testKey, result);
        verify(ossClient).putObject(any(PutObjectRequest.class));
    }

    @Test
    void putObjectShouldThrowIOExceptionWhenFileError() throws IOException {
        when(multipartFile.getInputStream()).thenThrow(new IOException("Test exception"));

        assertThrows(IOException.class, () -> {
            ossService.putObject(testBucket, testKey, multipartFile);
        });
    }
}