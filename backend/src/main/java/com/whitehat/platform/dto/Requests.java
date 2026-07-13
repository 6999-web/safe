package com.whitehat.platform.dto;

import jakarta.validation.constraints.*; import java.math.BigDecimal; import java.time.LocalDate;

public final class Requests {
 private Requests(){}
 public record Register(@NotBlank @Pattern(regexp="^[a-zA-Z0-9_]{4,30}$") String username,@NotBlank @Size(min=8,max=64) String password,@NotBlank @Size(max=60) String nickname,@Email String email){}
 public record Login(@NotBlank String username,@NotBlank String password){}
 public record TaskCreate(@NotBlank @Size(max=160) String title,@NotBlank @Pattern(regexp="PENETRATION|BUG_BOUNTY|SECURITY_AUDIT|RED_BLUE|CTF") String type,@NotBlank String description,@NotBlank String targetAssets,@NotNull LocalDate startDate,@NotNull LocalDate endDate,@NotNull @DecimalMin("0") BigDecimal rewardAmount,@NotBlank @Pattern(regexp="BEGINNER|INTERMEDIATE|ADVANCED|EXPERT") String difficulty,@NotBlank @Pattern(regexp="LOW|MEDIUM|HIGH|CRITICAL") String minSeverity,@Min(1) @Max(1000) int memberLimit){}
 public record TaskApply(@NotNull Long taskId,@Size(max=500) String message){}
 public record Daily(@NotNull Long taskId,@NotNull LocalDate reportDate,@NotBlank String workContent,@NotBlank String testTarget,String findings,String riskAnalysis,@NotBlank String nextPlan,String attachmentUrl){}
 public record VulnerabilityCreate(@NotNull Long taskId,@NotBlank @Size(max=200) String title,@NotBlank String vulnerabilityType,@NotBlank String affectedAsset,@NotBlank String description,@NotBlank String reproductionSteps,String pocAttachmentUrl,@NotBlank @Pattern(regexp="LOW|MEDIUM|HIGH|CRITICAL") String severity,@DecimalMin("0.0") @DecimalMax("10.0") BigDecimal cvssScore){}
 public record VulnerabilityReview(@NotBlank @Pattern(regexp="CONFIRMED|REJECTED|NEED_MORE_INFO") String status,@Size(max=1000) String reviewComment,@Pattern(regexp="LOW|MEDIUM|HIGH|CRITICAL") String severity){}
 public record PostCreate(@NotBlank String category,@NotBlank @Size(max=200) String title,@NotBlank @Size(max=20000) String content){}
 public record CommentCreate(@NotBlank @Size(max=2000) String content){}
}
