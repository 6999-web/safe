package com.whitehat.platform.config;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whitehat.platform.domain.*;
import com.whitehat.platform.mapper.*;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;

/** Creates a repeatable data set that exercises every core workflow state. */
@Component
@Order(100)
public class DemoDataInitializer implements CommandLineRunner {
    @Value("${DEMO_PASSWORD:Research@123}")
    private String demoPassword;
    private final UserMapper users;
    private final CompanyMapper companies;
    private final SecurityTaskMapper tasks;
    private final TaskMemberMapper members;
    private final DailyReportMapper dailyReports;
    private final VulnerabilityReportMapper vulnerabilities;
    private final ScoreRecordMapper scores;
    private final ForumPostMapper posts;
    private final ForumCommentMapper comments;
    private final PasswordEncoder encoder;

    public DemoDataInitializer(UserMapper users, CompanyMapper companies, SecurityTaskMapper tasks,
                               TaskMemberMapper members, DailyReportMapper dailyReports,
                               VulnerabilityReportMapper vulnerabilities, ScoreRecordMapper scores,
                               ForumPostMapper posts, ForumCommentMapper comments, PasswordEncoder encoder) {
        this.users = users;
        this.companies = companies;
        this.tasks = tasks;
        this.members = members;
        this.dailyReports = dailyReports;
        this.vulnerabilities = vulnerabilities;
        this.scores = scores;
        this.posts = posts;
        this.comments = comments;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        User primary = requireUser("whitehat");
        User alice = ensureUser("alice", demoPassword, "边界守望者", 250, "Web安全,API安全,代码审计");
        User bob = ensureUser("bob", demoPassword, "云端哨兵", 520, "云安全,容器安全,Kubernetes");
        User carol = ensureUser("carol", demoPassword, "逆向旅人", 80, "二进制安全,移动安全,逆向工程");
        Company company = requireCompany("91310000DEMO2026");

        SecurityTask web = ensureTask(company, "TASK-DEMO-WEB-001", "核心业务 API 渗透测试", "PENETRATION", "IN_PROGRESS", "ADVANCED", "HIGH", "12000", 15, 21);
        SecurityTask cloud = ensureTask(company, "TASK-DEMO-CLOUD-002", "云原生资产漏洞赏金计划", "BUG_BOUNTY", "OPEN", "EXPERT", "MEDIUM", "30000", 30, 45);
        SecurityTask audit = ensureTask(company, "TASK-DEMO-AUDIT-003", "移动端安全代码审计", "SECURITY_AUDIT", "REVIEWING", "INTERMEDIATE", "LOW", "8000", 8, 12);
        SecurityTask redBlue = ensureTask(company, "TASK-DEMO-RED-004", "季度红蓝对抗演练", "RED_BLUE", "COMPLETED", "EXPERT", "HIGH", "50000", 12, -3);
        SecurityTask ctf = ensureTask(company, "TASK-DEMO-CTF-005", "新手 Web CTF 挑战赛", "CTF", "OPEN", "BEGINNER", "LOW", "3000", 100, 30);

        TaskMember primaryWeb = ensureMember(web, primary, "APPROVED", "擅长 API 鉴权与业务逻辑测试");
        TaskMember aliceWeb = ensureMember(web, alice, "APPROVED", "具有三年 Web 渗透测试经验");
        TaskMember bobCloud = ensureMember(cloud, bob, "APPROVED", "专注云原生攻防研究");
        TaskMember carolAudit = ensureMember(audit, carol, "APPROVED", "具备 Android 逆向与代码审计经验");
        ensureMember(redBlue, primary, "COMPLETED", "参与攻击路径验证与复盘");
        ensureMember(ctf, carol, "APPLIED", "希望通过挑战提升 Web 安全能力");

        ensureDaily(primaryWeb, LocalDate.now().minusDays(1), "完成登录、会话和对象级授权测试", "api.demo.example.com", "发现订单详情接口存在疑似横向越权", "攻击者可能读取其他租户订单信息", "补充自动化验证并整理完整复现证据");
        ensureDaily(primaryWeb, LocalDate.now(), "复现订单越权并验证影响范围", "订单查询与导出接口", "确认两个接口共用存在缺陷的鉴权逻辑", "影响租户数据机密性", "提交漏洞报告并协助企业定位修复点");
        ensureDaily(aliceWeb, LocalDate.now(), "完成认证接口与密码策略测试", "auth.demo.example.com", "未发现可利用问题", "当前风险较低", "继续测试文件上传和回调接口");
        ensureDaily(bobCloud, LocalDate.now(), "梳理公网暴露资产与 Kubernetes 入口", "*.cloud.demo.example.com", "发现测试环境响应头泄露版本信息", "可能辅助攻击者识别组件漏洞", "验证是否存在对应已知漏洞");
        ensureDaily(carolAudit, LocalDate.now().minusDays(1), "完成网络模块静态分析", "Android 5.2.0 测试包", "发现证书校验实现存在异常分支", "中间人攻击风险待动态验证", "搭建代理环境进行动态复现");

        VulnerabilityReport confirmedHigh = ensureVulnerability(web, primary, "VUL-DEMO-0001", "订单详情接口横向越权", "BROKEN_ACCESS_CONTROL", "HIGH", "CONFIRMED", "8.1", "企业已复现，修复方案已进入开发排期");
        VulnerabilityReport submitted = ensureVulnerability(web, alice, "VUL-DEMO-0002", "文件上传响应泄露存储路径", "INFORMATION_DISCLOSURE", "LOW", "SUBMITTED", "3.1", null);
        VulnerabilityReport moreInfo = ensureVulnerability(cloud, bob, "VUL-DEMO-0003", "容器镜像仓库匿名读取", "SECURITY_MISCONFIGURATION", "CRITICAL", "NEED_MORE_INFO", "9.1", "请补充受影响镜像列表与访问时间");
        VulnerabilityReport rejected = ensureVulnerability(audit, carol, "VUL-DEMO-0004", "客户端硬编码测试环境地址", "MOBILE_CONFIGURATION", "LOW", "REJECTED", "2.0", "该地址仅存在于隔离测试包，不构成生产影响");
        VulnerabilityReport confirmedMedium = ensureVulnerability(redBlue, primary, "VUL-DEMO-0005", "内部监控面板敏感版本信息泄露", "INFORMATION_DISCLOSURE", "MEDIUM", "CONFIRMED", "5.3", "演练期间确认并已关闭外部访问");

        ensureScore(confirmedHigh, 200);
        ensureScore(confirmedMedium, 50);
        ensureBaselineScore(alice, 250);
        ensureBaselineScore(bob, 520);
        ensureBaselineScore(carol, 80);
        syncScore(primary);
        syncScore(alice);
        syncScore(bob);
        syncScore(carol);

        ForumPost accessPost = ensurePost(primary, "Web安全", "从一次越权漏洞看 API 鉴权边界", "复盘对象级授权缺失的发现过程，以及如何系统化验证横向越权。", 328, 42, 6);
        ForumPost cloudPost = ensurePost(bob, "云安全", "Kubernetes 暴露面检查清单", "从入口控制器、API Server、镜像仓库到工作负载权限，整理一份可复用的授权测试清单。", 215, 31, 4);
        ForumPost mobilePost = ensurePost(carol, "移动安全", "Android 证书校验的常见实现缺陷", "结合静态分析与动态代理，讨论自定义 TrustManager 中容易被忽略的异常分支。", 146, 18, 2);
        ForumPost aiPost = ensurePost(alice, "AI安全", "大模型应用提示词注入测试方法", "围绕数据泄露、工具滥用和间接提示词注入，建立可重复的安全测试用例。", 402, 57, 1);
        ensureComment(accessPost, alice, "对象级授权建议同时覆盖详情、导出和批量接口。", 4);
        ensureComment(accessPost, bob, "云环境还需要关注租户 ID 是否被下游服务重新校验。", 3);
        ensureComment(cloudPost, primary, "清单很实用，建议补充临时凭证和元数据服务检查。", 2);
        ensureComment(mobilePost, alice, "可以再加入网络安全配置文件与代码实现不一致的案例。", 1);
        ensureComment(aiPost, bob, "工具调用权限边界确实是当前最需要关注的部分。", 0);
    }

    private User requireUser(String username) {
        User user = users.selectOne(Wrappers.<User>lambdaQuery().eq(User::getUsername, username));
        if (user == null) throw new IllegalStateException("Required demo user missing: " + username);
        return user;
    }

    private User ensureUser(String username, String password, String nickname, int score, String skills) {
        User user = users.selectOne(Wrappers.<User>lambdaQuery().eq(User::getUsername, username));
        if (user != null) return user;
        user = new User();
        user.setUsername(username); user.setPasswordHash(encoder.encode(password)); user.setNickname(nickname);
        user.setRole("WHITEHAT"); user.setScore(score); user.setLevelId(levelFor(score)); user.setSkills(skills);
        user.setStatus("ACTIVE"); user.setCreatedAt(OffsetDateTime.now()); user.setUpdatedAt(OffsetDateTime.now());
        users.insert(user);
        return user;
    }

    private Company requireCompany(String creditCode) {
        Company company = companies.selectOne(Wrappers.<Company>lambdaQuery().eq(Company::getCreditCode, creditCode));
        if (company == null) throw new IllegalStateException("Required demo company missing: " + creditCode);
        return company;
    }

    private SecurityTask ensureTask(Company company, String taskNo, String title, String type, String status,
                                    String difficulty, String severity, String reward, int limit, int endOffset) {
        SecurityTask task = tasks.selectOne(Wrappers.<SecurityTask>lambdaQuery().eq(SecurityTask::getTaskNo, taskNo));
        if (task != null) return task;
        task = new SecurityTask();
        task.setTaskNo(taskNo); task.setCompanyId(company.getId()); task.setTitle(title); task.setType(type);
        task.setDescription("对企业明确授权范围内的目标开展安全测试，提交可复现、可修复并包含风险说明的报告。");
        task.setTargetAssets("*.demo.example.com（仅限平台任务书列明的测试环境）");
        task.setStartDate(LocalDate.now().minusDays(5)); task.setEndDate(LocalDate.now().plusDays(endOffset));
        task.setRewardAmount(new BigDecimal(reward)); task.setDifficulty(difficulty); task.setMinSeverity(severity);
        task.setMemberLimit(limit); task.setStatus(status); task.setCreatedAt(OffsetDateTime.now().minusDays(8));
        tasks.insert(task);
        return task;
    }

    private TaskMember ensureMember(SecurityTask task, User user, String status, String message) {
        TaskMember member = members.selectOne(Wrappers.<TaskMember>lambdaQuery().eq(TaskMember::getTaskId, task.getId()).eq(TaskMember::getUserId, user.getId()));
        if (member != null) return member;
        member = new TaskMember(); member.setTaskId(task.getId()); member.setUserId(user.getId());
        member.setStatus(status); member.setApplyMessage(message); member.setJoinedAt(OffsetDateTime.now().minusDays(4));
        members.insert(member); return member;
    }

    private void ensureDaily(TaskMember member, LocalDate date, String work, String target, String findings, String risk, String plan) {
        if (dailyReports.selectCount(Wrappers.<DailyReport>lambdaQuery().eq(DailyReport::getTaskMemberId, member.getId()).eq(DailyReport::getReportDate, date)) > 0) return;
        DailyReport report = new DailyReport(); report.setTaskMemberId(member.getId()); report.setReportDate(date);
        report.setWorkContent(work); report.setTestTarget(target); report.setFindings(findings);
        report.setRiskAnalysis(risk); report.setNextPlan(plan); report.setCreatedAt(OffsetDateTime.now());
        dailyReports.insert(report);
    }

    private VulnerabilityReport ensureVulnerability(SecurityTask task, User submitter, String reportNo, String title,
                                                     String type, String severity, String status, String cvss, String comment) {
        VulnerabilityReport report = vulnerabilities.selectOne(Wrappers.<VulnerabilityReport>lambdaQuery().eq(VulnerabilityReport::getReportNo, reportNo));
        if (report != null) return report;
        report = new VulnerabilityReport(); report.setReportNo(reportNo); report.setTaskId(task.getId());
        report.setSubmitterId(submitter.getId()); report.setTitle(title); report.setVulnerabilityType(type);
        report.setAffectedAsset("https://api.demo.example.com/v1/authorized-target");
        report.setDescription("在授权测试范围内发现该问题，可稳定复现并对业务数据或系统安全造成影响。");
        report.setReproductionSteps("1. 使用测试账号登录；2. 请求授权目标接口；3. 修改受控参数；4. 观察越权或异常响应。");
        report.setSeverity(severity); report.setCvssScore(new BigDecimal(cvss)); report.setStatus(status);
        report.setReviewComment(comment); report.setCreatedAt(OffsetDateTime.now().minusDays(2));
        if (!"SUBMITTED".equals(status)) report.setReviewedAt(OffsetDateTime.now().minusDays(1));
        vulnerabilities.insert(report); return report;
    }

    private void ensureScore(VulnerabilityReport vulnerability, int delta) {
        if (scores.selectCount(Wrappers.<ScoreRecord>lambdaQuery().eq(ScoreRecord::getUserId, vulnerability.getSubmitterId()).eq(ScoreRecord::getSourceType, "VULNERABILITY").eq(ScoreRecord::getSourceId, vulnerability.getId())) > 0) return;
        ScoreRecord record = new ScoreRecord(); record.setUserId(vulnerability.getSubmitterId()); record.setDelta(delta);
        record.setSourceType("VULNERABILITY"); record.setSourceId(vulnerability.getId());
        record.setDescription("漏洞 " + vulnerability.getReportNo() + " 确认奖励"); record.setCreatedAt(OffsetDateTime.now().minusDays(1));
        scores.insert(record);
    }

    private void ensureBaselineScore(User user, int delta) {
        if (scores.selectCount(Wrappers.<ScoreRecord>lambdaQuery().eq(ScoreRecord::getUserId, user.getId()).eq(ScoreRecord::getSourceType, "DEMO_BASELINE").eq(ScoreRecord::getSourceId, user.getId())) > 0) return;
        ScoreRecord record = new ScoreRecord(); record.setUserId(user.getId()); record.setDelta(delta);
        record.setSourceType("DEMO_BASELINE"); record.setSourceId(user.getId()); record.setDescription("历史研究贡献初始化");
        record.setCreatedAt(OffsetDateTime.now().minusDays(30)); scores.insert(record);
    }

    private void syncScore(User user) {
        List<ScoreRecord> records = scores.selectList(Wrappers.<ScoreRecord>lambdaQuery().eq(ScoreRecord::getUserId, user.getId()));
        int total = records.stream().mapToInt(ScoreRecord::getDelta).sum();
        user.setScore(total); user.setLevelId(levelFor(total)); user.setUpdatedAt(OffsetDateTime.now()); users.updateById(user);
    }

    private ForumPost ensurePost(User author, String category, String title, String content, int views, int likes, int daysAgo) {
        ForumPost post = posts.selectOne(Wrappers.<ForumPost>lambdaQuery().eq(ForumPost::getTitle, title));
        if (post != null) return post;
        post = new ForumPost(); post.setAuthorId(author.getId()); post.setCategory(category); post.setTitle(title); post.setContent(content);
        post.setViewCount(views); post.setLikeCount(likes); post.setCreatedAt(OffsetDateTime.now().minusDays(daysAgo)); post.setUpdatedAt(post.getCreatedAt());
        posts.insert(post); return post;
    }

    private void ensureComment(ForumPost post, User author, String content, int daysAgo) {
        if (comments.selectCount(Wrappers.<ForumComment>lambdaQuery().eq(ForumComment::getPostId, post.getId()).eq(ForumComment::getAuthorId, author.getId()).eq(ForumComment::getContent, content)) > 0) return;
        ForumComment comment = new ForumComment(); comment.setPostId(post.getId()); comment.setAuthorId(author.getId());
        comment.setContent(content); comment.setCreatedAt(OffsetDateTime.now().minusDays(daysAgo)); comments.insert(comment);
    }

    private long levelFor(int score) { return score >= 4000 ? 5L : score >= 1500 ? 4L : score >= 500 ? 3L : score >= 100 ? 2L : 1L; }
}
