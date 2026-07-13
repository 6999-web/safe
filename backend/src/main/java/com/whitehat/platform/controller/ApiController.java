package com.whitehat.platform.controller;

import com.whitehat.platform.common.ApiResponse; import com.whitehat.platform.config.CurrentUser; import com.whitehat.platform.dto.Requests; import com.whitehat.platform.service.*;
import com.whitehat.platform.integration.IntegrationGateway; import jakarta.validation.Valid; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.security.core.Authentication; import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api") public class ApiController {
 private final AuthService auth; private final PlatformService platform; private final IntegrationGateway integrations;
 public ApiController(AuthService a,PlatformService p,IntegrationGateway i){auth=a;platform=p;integrations=i;}
 @PostMapping("/register") public ApiResponse<?> register(@Valid @RequestBody Requests.Register r){return ApiResponse.ok(auth.register(r));}
 @PostMapping("/login") public ApiResponse<?> login(@Valid @RequestBody Requests.Login r){return ApiResponse.ok(auth.login(r));}
 @GetMapping("/dashboard/stats") public ApiResponse<?> stats(){return ApiResponse.ok(platform.dashboard());}
 @GetMapping("/tasks") public ApiResponse<?> tasks(@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="12") int size,@RequestParam(required=false) String keyword,@RequestParam(required=false) String type){return ApiResponse.ok(platform.taskPage(page,Math.min(size,100),keyword,type));}
 @GetMapping("/tasks/{id}") public ApiResponse<?> task(@PathVariable Long id){return ApiResponse.ok(platform.task(id));}
 @PostMapping("/task/create") @PreAuthorize("hasRole('COMPANY')") public ApiResponse<?> create(@Valid @RequestBody Requests.TaskCreate r){return ApiResponse.ok(platform.createTask(CurrentUser.id(),r));}
 @PostMapping("/task/apply") @PreAuthorize("hasRole('WHITEHAT')") public ApiResponse<?> apply(@Valid @RequestBody Requests.TaskApply r){return ApiResponse.ok(platform.apply(CurrentUser.id(),r));}
 @GetMapping("/task/mine") public ApiResponse<?> mine(Authentication a){return ApiResponse.ok(platform.myTasks(CurrentUser.id(),a.getAuthorities().iterator().next().getAuthority().substring(5)));}
 @PostMapping("/report/daily") @PreAuthorize("hasRole('WHITEHAT')") public ApiResponse<?> daily(@Valid @RequestBody Requests.Daily r){return ApiResponse.ok(platform.daily(CurrentUser.id(),r));}
 @GetMapping("/report/task/{taskId}") @PreAuthorize("hasAnyRole('COMPANY','ADMIN')") public ApiResponse<?> reports(@PathVariable Long taskId){return ApiResponse.ok(platform.taskReports(CurrentUser.id(),taskId));}
 @PostMapping("/vulnerability/create") @PreAuthorize("hasRole('WHITEHAT')") public ApiResponse<?> vulnerability(@Valid @RequestBody Requests.VulnerabilityCreate r){return ApiResponse.ok(platform.createVulnerability(CurrentUser.id(),r));}
 @GetMapping("/vulnerability/list") public ApiResponse<?> vulnerabilities(Authentication a){return ApiResponse.ok(platform.vulnerabilities(CurrentUser.id(),a.getAuthorities().iterator().next().getAuthority().substring(5)));}
 @PutMapping("/vulnerability/{id}/review") @PreAuthorize("hasAnyRole('COMPANY','ADMIN')") public ApiResponse<?> review(@PathVariable Long id,@Valid @RequestBody Requests.VulnerabilityReview r){return ApiResponse.ok(platform.review(CurrentUser.id(),id,r));}
 @GetMapping("/user/profile") public ApiResponse<?> profile(){return ApiResponse.ok(platform.profile(CurrentUser.id()));}
 @GetMapping("/user/rank") public ApiResponse<?> rank(){return ApiResponse.ok(platform.rank());}
 @GetMapping("/forum/posts") public ApiResponse<?> posts(){return ApiResponse.ok(platform.forumPosts());}
 @PostMapping("/forum/posts") public ApiResponse<?> post(@Valid @RequestBody Requests.PostCreate r){return ApiResponse.ok(platform.post(CurrentUser.id(),r));}
 @PostMapping("/forum/posts/{id}/comments") public ApiResponse<?> comment(@PathVariable Long id,@Valid @RequestBody Requests.CommentCreate r){return ApiResponse.ok(platform.comment(CurrentUser.id(),id,r.content()));}
 @GetMapping("/admin/integrations") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<?> integrations(){return ApiResponse.ok(integrations.health());}
 @GetMapping("/admin/overview") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<?> adminOverview(){return ApiResponse.ok(platform.dashboard());}
}
