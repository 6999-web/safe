<script setup lang="ts">
import {useRoute,useRouter} from 'vue-router'; import {useAuthStore} from '@/stores/auth'; import {DataAnalysis,Briefcase,User,ChatDotRound,OfficeBuilding,Lock,SwitchButton} from '@element-plus/icons-vue';
const auth=useAuthStore(),route=useRoute(),router=useRouter(); const nav=[['/','安全态势',DataAnalysis],['/tasks','任务大厅',Briefcase],['/profile','白帽中心',User],['/company','企业中心',OfficeBuilding],['/community','安全社区',ChatDotRound]] as const;
function logout(){auth.logout();router.push('/')}
</script>
<template>
 <div class="app-shell">
  <header class="topbar">
   <router-link to="/" class="brand"><span class="brand-mark"><Lock/></span><span><b>WHITEHAT</b><small>SECURITY HUB</small></span></router-link>
   <nav><router-link v-for="[path,label,icon] in nav" :key="path" :to="path" :class="{active:route.path===path}"><component :is="icon"/><span>{{label}}</span></router-link></nav>
   <div class="account"><template v-if="auth.user"><span class="status-dot"></span><div><b>{{auth.user.nickname}}</b><small>{{auth.user.role}}</small></div><el-button text circle aria-label="退出登录" @click="logout"><el-icon><SwitchButton/></el-icon></el-button></template><router-link v-else to="/login" class="login-link">登录平台</router-link></div>
  </header>
  <main><router-view/></main>
  <footer><span>WHITEHAT SECURITY HUB</span><span>AUTHORIZED SECURITY RESEARCH ONLY · 2026</span></footer>
 </div>
</template>

