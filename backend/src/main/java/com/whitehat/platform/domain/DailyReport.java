package com.whitehat.platform.domain;
import com.baomidou.mybatisplus.annotation.*; import lombok.Data; import java.time.*;
@Data @TableName("daily_report") public class DailyReport { @TableId(type=IdType.AUTO) private Long id; private Long taskMemberId; private LocalDate reportDate; private String workContent; private String testTarget; private String findings; private String riskAnalysis; private String nextPlan; private String attachmentUrl; private OffsetDateTime createdAt; }

