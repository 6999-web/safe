package com.whitehat.platform.domain;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.OffsetDateTime;

@Data @TableName("app_user")
public class User {
    @TableId(type = IdType.AUTO) private Long id;
    private String username; private String passwordHash; private String nickname; private String email;
    private String avatarUrl; private String bio; private String skills; private String role;
    private Integer score; private Long levelId; private String status;
    private OffsetDateTime createdAt; private OffsetDateTime updatedAt;
}

