package com.whitehat.platform.domain;
import com.baomidou.mybatisplus.annotation.*; import lombok.Data; import java.time.OffsetDateTime;
@Data @TableName("forum_comment") public class ForumComment { @TableId(type=IdType.AUTO) private Long id; private Long postId; private Long authorId; private String content; private OffsetDateTime createdAt; }

