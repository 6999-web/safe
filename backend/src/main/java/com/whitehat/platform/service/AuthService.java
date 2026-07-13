package com.whitehat.platform.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers; import com.whitehat.platform.common.BusinessException; import com.whitehat.platform.common.ConflictException; import com.whitehat.platform.config.JwtService; import com.whitehat.platform.domain.User; import com.whitehat.platform.dto.Requests; import com.whitehat.platform.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Service;
import java.time.OffsetDateTime; import java.util.Map;

@Service public class AuthService {
 private final UserMapper users; private final PasswordEncoder encoder; private final JwtService jwt;
 public AuthService(UserMapper users,PasswordEncoder encoder,JwtService jwt){this.users=users;this.encoder=encoder;this.jwt=jwt;}
 public Map<String,Object> register(Requests.Register r){if(users.selectCount(Wrappers.<User>lambdaQuery().eq(User::getUsername,r.username()))>0)throw new ConflictException("用户名已存在，请更换后重试");User u=new User();u.setUsername(r.username());u.setPasswordHash(encoder.encode(r.password()));u.setNickname(r.nickname());u.setEmail(r.email());u.setRole("WHITEHAT");u.setScore(0);u.setLevelId(1L);u.setStatus("ACTIVE");u.setCreatedAt(OffsetDateTime.now());u.setUpdatedAt(OffsetDateTime.now());users.insert(u);return session(u);}
 public Map<String,Object> login(Requests.Login r){User u=users.selectOne(Wrappers.<User>lambdaQuery().eq(User::getUsername,r.username()));if(u==null||!encoder.matches(r.password(),u.getPasswordHash()))throw new BusinessException("用户名或密码错误");if(!"ACTIVE".equals(u.getStatus()))throw new BusinessException("账号已停用");return session(u);}
 private Map<String,Object> session(User u){return Map.of("token",jwt.create(u.getId(),u.getUsername(),u.getRole()),"user",Map.of("id",u.getId(),"username",u.getUsername(),"nickname",u.getNickname(),"role",u.getRole(),"score",u.getScore()));}
}
