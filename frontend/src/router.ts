import {createRouter,createWebHistory} from 'vue-router';
const routes=[
 {path:'/',component:()=>import('@/views/DashboardView.vue')},{path:'/tasks',component:()=>import('@/views/TasksView.vue')},
 {path:'/profile',component:()=>import('@/views/ProfileView.vue'),meta:{auth:true}},{path:'/company',component:()=>import('@/views/CompanyView.vue'),meta:{auth:true}},
 {path:'/community',component:()=>import('@/views/CommunityView.vue')},{path:'/login',component:()=>import('@/views/LoginView.vue')}
];
const router=createRouter({history:createWebHistory(),routes,scrollBehavior:()=>({top:0})});router.beforeEach(to=>{if(to.meta.auth&&!localStorage.getItem('wh_token'))return{path:'/login',query:{redirect:to.fullPath}}});export default router;

