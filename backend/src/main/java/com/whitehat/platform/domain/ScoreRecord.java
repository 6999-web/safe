package com.whitehat.platform.domain;
import com.baomidou.mybatisplus.annotation.*; import lombok.Data; import java.time.OffsetDateTime;
@Data @TableName("score_record") public class ScoreRecord { @TableId(type=IdType.AUTO) private Long id; private Long userId; private Integer delta; private String sourceType; private Long sourceId; private String description; private OffsetDateTime createdAt; }

