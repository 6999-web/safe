package com.whitehat.platform.controller;

import com.whitehat.platform.common.*; import org.springframework.beans.factory.annotation.Value; import org.springframework.web.bind.annotation.*; import org.springframework.web.multipart.MultipartFile;
import java.io.IOException; import java.nio.file.*; import java.util.*;

@RestController @RequestMapping("/api/files") public class FileController {
 private static final Set<String> TYPES=Set.of("application/pdf","image/png","image/jpeg","text/plain","application/zip"); private final Path root;
 public FileController(@Value("${storage.upload-dir}") String dir)throws IOException{root=Paths.get(dir).toAbsolutePath().normalize();Files.createDirectories(root);}
 @PostMapping("/upload") public ApiResponse<?> upload(@RequestPart MultipartFile file)throws IOException{if(file.isEmpty()||file.getSize()>10*1024*1024)throw new BusinessException("文件为空或超过 10MB");if(!TYPES.contains(Optional.ofNullable(file.getContentType()).orElse("")))throw new BusinessException("不支持的文件类型");String original=Optional.ofNullable(file.getOriginalFilename()).orElse("file");String ext=original.contains(".")?original.substring(original.lastIndexOf('.')).toLowerCase():"";if(!Set.of(".pdf",".png",".jpg",".jpeg",".txt",".zip").contains(ext))throw new BusinessException("文件扩展名不允许");String stored=UUID.randomUUID()+ext;Path target=root.resolve(stored).normalize();if(!target.startsWith(root))throw new BusinessException("非法文件名");try(var in=file.getInputStream()){Files.copy(in,target,StandardCopyOption.REPLACE_EXISTING);}return ApiResponse.ok(Map.of("url","/uploads/"+stored,"originalName",original));}
}

