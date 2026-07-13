package com.whitehat.platform.config;
import com.whitehat.platform.common.BusinessException; import org.springframework.security.core.context.SecurityContextHolder;
public final class CurrentUser { private CurrentUser(){} public static Long id(){Object p=SecurityContextHolder.getContext().getAuthentication().getPrincipal();if(p instanceof Long id)return id;throw new BusinessException("请先登录");} }

