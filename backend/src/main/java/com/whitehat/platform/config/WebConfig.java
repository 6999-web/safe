package com.whitehat.platform.config;

import org.springframework.beans.factory.annotation.Value; import org.springframework.context.annotation.Configuration; import org.springframework.web.servlet.config.annotation.*;
import java.nio.file.Paths;

@Configuration public class WebConfig implements WebMvcConfigurer {
 private final String uploadDir; public WebConfig(@Value("${storage.upload-dir}") String uploadDir){this.uploadDir=uploadDir;}
 @Override public void addResourceHandlers(ResourceHandlerRegistry registry){String location=Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();registry.addResourceHandler("/uploads/**").addResourceLocations(location).setCachePeriod(3600);}
}
