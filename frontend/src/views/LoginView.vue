<script setup lang="ts">
import {ref} from 'vue';import {useAuthStore} from '@/stores/auth';import {useRoute,useRouter} from 'vue-router';import {ElMessage} from 'element-plus';import {Lock,User,Key} from '@element-plus/icons-vue';

const demoAccounts={
 whitehat:{username:'whitehat',password:'WhResearch@2026!3Qx7'},
 company:{username:'acme',password:'WhCompany@2026!4Lm8'},
 admin:{username:'admin',password:'WhAdmin@2026!7Kp9'}
} as const;
const auth=useAuthStore(),route=useRoute(),router=useRouter(),mode=ref<'login'|'register'>('login'),username=ref(''),password=ref(''),nickname=ref(''),email=ref(''),loading=ref(false);

function switchMode(next:'login'|'register'){
 mode.value=next;username.value='';password.value='';nickname.value='';email.value='';
}
function validate(){
 username.value=username.value.trim();nickname.value=nickname.value.trim();email.value=email.value.trim();
 if(!username.value||!password.value)return '请输入用户名和密码';
 if(mode.value==='register'&&!/^[a-zA-Z0-9_]{4,30}$/.test(username.value))return '用户名须为 4-30 位字母、数字或下划线';
 if(mode.value==='register'&&(password.value.length<8||password.value.length>64))return '密码长度须为 8-64 位';
 if(mode.value==='register'&&(!nickname.value||nickname.value.length>60))return '请输入不超过 60 个字符的研究员昵称';
 if(mode.value==='register'&&email.value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))return '请输入正确的邮箱地址';
 return '';
}
async function submit(){
 const error=validate();if(error){ElMessage.warning(error);return}
 try{
  loading.value=true;
  if(mode.value==='login')await auth.login(username.value,password.value);else await auth.register({username:username.value,password:password.value,nickname:nickname.value,email:email.value||undefined});
  ElMessage.success(mode.value==='login'?'身份验证成功':'白帽账号注册成功');
  const fallback=auth.user?.role==='WHITEHAT'?'/profile':'/company';
  await router.push(String(route.query.redirect||fallback));
 }catch(e:any){ElMessage.error(e.message)}finally{loading.value=false}
}
function preset(account:keyof typeof demoAccounts){const value=demoAccounts[account];mode.value='login';username.value=value.username;password.value=value.password}
</script>
<template><div class="login-page"><div class="auth-panel"><div class="auth-brand"><span><Lock/></span><div><b>WHITEHAT SECURITY HUB</b><small>IDENTITY ACCESS GATEWAY</small></div></div><div class="auth-copy"><span class="eyebrow">SECURE ACCESS // NODE CN-01</span><h1>{{mode==='login'?'授权安全研究入口':'注册白帽研究员'}}</h1><p>{{mode==='login'?'使用平台身份进入任务、漏洞和社区协作空间。':'创建研究身份，加入授权安全测试与社区协作。'}}</p></div><div class="mode"><button type="button" :class="{active:mode==='login'}" @click="switchMode('login')">账号登录</button><button type="button" :class="{active:mode==='register'}" @click="switchMode('register')">研究员注册</button></div><el-form @submit.prevent="submit"><el-form-item><el-input v-model="username" size="large" maxlength="30" autocomplete="username" placeholder="用户名（4-30 位字母、数字、下划线）"><template #prefix><el-icon><User/></el-icon></template></el-input></el-form-item><template v-if="mode==='register'"><el-form-item><el-input v-model="nickname" size="large" maxlength="60" placeholder="研究员昵称"/></el-form-item><el-form-item><el-input v-model="email" size="large" type="email" autocomplete="email" placeholder="邮箱（可选）"/></el-form-item></template><el-form-item><el-input v-model="password" size="large" type="password" maxlength="64" show-password :autocomplete="mode==='login'?'current-password':'new-password'" placeholder="密码（8-64 位）" @keyup.enter="submit"><template #prefix><el-icon><Key/></el-icon></template></el-input></el-form-item><el-button type="primary" size="large" :loading="loading" native-type="submit">{{mode==='login'?'验证并进入平台':'注册并进入平台'}}</el-button></el-form><div v-if="mode==='login'" class="presets"><span>演示身份</span><button type="button" @click="preset('whitehat')">白帽研究员</button><button type="button" @click="preset('company')">企业管理员</button><button type="button" @click="preset('admin')">平台管理员</button></div><div class="security-note"><Lock/>演示账号仅用于功能体验，请勿用于真实业务数据</div></div><aside><div class="matrix"><i v-for="n in 64" :key="n" :style="{opacity:(n%7)/10+.15}">{{(n*37).toString(16).padStart(3,'0')}}</i></div><div class="aside-copy"><b>RESPONSIBLE DISCLOSURE</b><span>SECURITY THROUGH COLLABORATION</span></div></aside></div></template>
<style scoped>.login-page{min-height:calc(100vh - 112px);display:grid;grid-template-columns:1.1fr .9fr}.auth-panel{padding:clamp(35px,7vw,90px);display:flex;flex-direction:column;justify-content:center;max-width:720px}.auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:45px}.auth-brand>span{width:38px;height:38px;background:#39d5ff;color:#07111b;display:grid;place-items:center}.auth-brand svg{width:21px}.auth-brand b,.auth-brand small{display:block}.auth-brand b{font-size:12px;letter-spacing:1.7px}.auth-brand small{font:8px monospace;color:#617991;margin-top:3px}.auth-copy h1{font-size:29px;margin:10px 0}.auth-copy p{font-size:12px;color:#71869b;margin-bottom:20px}.mode{display:flex;max-width:430px;margin-bottom:16px;border-bottom:1px solid #26394c}.mode button{flex:1;border:0;border-bottom:2px solid transparent;background:transparent;color:#72879b;padding:9px;cursor:pointer}.mode button.active{color:#67ddf7;border-color:#39d5ff}.el-form{max-width:430px}.el-button{width:100%}.presets{display:flex;align-items:center;gap:6px;margin-top:22px;flex-wrap:wrap}.presets span{font-size:9px;color:#5f7489;margin-right:4px}.presets button{border:1px solid #263a4d;background:#0a1622;color:#8497aa;font-size:9px;padding:6px 8px;cursor:pointer}.presets button:hover{color:#62dcf8;border-color:#2a7c99}.security-note{font-size:9px;color:#4f657a;border-top:1px solid #1a2b3b;margin-top:25px;padding-top:13px;display:flex;gap:7px;align-items:center}.security-note svg{width:12px}aside{position:relative;overflow:hidden;background:#07131f;border-left:1px solid #1b3043;display:grid;place-items:center}.matrix{display:grid;grid-template-columns:repeat(8,1fr);gap:18px;transform:rotate(-8deg) scale(1.2);color:#168cb0;font:10px monospace}.aside-copy{position:absolute;bottom:60px;left:55px}.aside-copy b,.aside-copy span{display:block}.aside-copy b{color:#55daf7;font-size:14px;letter-spacing:2px}.aside-copy span{font:9px monospace;color:#49677f;margin-top:6px}@media(max-width:800px){.login-page{grid-template-columns:1fr}.auth-panel{padding:35px 24px}.auth-brand{margin-bottom:35px}aside{display:none}}</style>
