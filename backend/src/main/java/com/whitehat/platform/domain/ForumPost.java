package com.whitehat.platform.domain;
import com.baomidou.mybatisplus.annotation.*; import lombok.Data; import java.time.OffsetDateTime;
@Data @TableName("forum_post") public class ForumPost { @TableId(type=IdType.AUTO) private Long id; private Long authorId; private String category; private String title; private String content; private Integer viewCount; private Integer likeCount; private OffsetDateTime createdAt; private OffsetDateTime updatedAt; }

