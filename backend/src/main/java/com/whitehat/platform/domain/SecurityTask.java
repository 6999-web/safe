package com.whitehat.platform.domain;
import com.baomidou.mybatisplus.annotation.*; import lombok.Data; import java.math.BigDecimal; import java.time.*;
@Data @TableName("security_task") public class SecurityTask { @TableId(type=IdType.AUTO) private Long id; private String taskNo; private Long companyId; private String title; private String type; private String description; private String targetAssets; private LocalDate startDate; private LocalDate endDate; private BigDecimal rewardAmount; private String difficulty; private String minSeverity; private Integer memberLimit; private String status; private OffsetDateTime createdAt; }

