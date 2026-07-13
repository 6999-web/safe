package com.whitehat.platform.domain;
import com.baomidou.mybatisplus.annotation.*; import lombok.Data; import java.time.OffsetDateTime;
@Data @TableName("task_member") public class TaskMember { @TableId(type=IdType.AUTO) private Long id; private Long taskId; private Long userId; private String applyMessage; private String status; private OffsetDateTime joinedAt; }

