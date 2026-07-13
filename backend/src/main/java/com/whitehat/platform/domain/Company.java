package com.whitehat.platform.domain;
import com.baomidou.mybatisplus.annotation.*; import lombok.Data; import java.time.OffsetDateTime;
@Data @TableName("company") public class Company { @TableId(type=IdType.AUTO) private Long id; private Long adminUserId; private String name; private String creditCode; private String description; private String logoUrl; private String status; private OffsetDateTime createdAt; }

