<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Aim, DocumentChecked, Medal, Plus, Trophy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const profile = ref<any>({})
const rank = ref<any[]>([])
const tasks = ref<any[]>([])
const dailyOpen = ref(false)
const vulnOpen = ref(false)
const levels = ['', '新手白帽', '初级研究员', '高级研究员', '专家白帽', '安全大神']
const daily = ref({ taskId: null as number | null, reportDate: new Date().toISOString().slice(0, 10), workContent: '', testTarget: '', findings: '', riskAnalysis: '', nextPlan: '' })
const vuln = ref({ taskId: null as number | null, title: '', vulnerabilityType: '', affectedAsset: '', description: '', reproductionSteps: '', severity: 'MEDIUM', cvssScore: 5 })

onMounted(async () => {
  try {
    ;[profile.value, rank.value, tasks.value] = await Promise.all([api.get('/user/profile'), api.get('/user/rank'), api.get('/task/mine')])
  } catch {
    profile.value = { nickname: '未连接', score: 0, levelId: 1, rank: '-', skills: '', completedTasks: 0, vulnerabilities: 0 }
  }
})

async function submitDaily() {
  try { await api.post('/report/daily', daily.value); ElMessage.success('日报已提交'); dailyOpen.value = false }
  catch (e: any) { ElMessage.error(e.message) }
}
async function submitVuln() {
  try { await api.post('/vulnerability/create', vuln.value); ElMessage.success('漏洞报告已提交审核'); vulnOpen.value = false }
  catch (e: any) { ElMessage.error(e.message) }
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div><span class="eyebrow">Researcher command center</span><h1>白帽个人中心</h1><p>跟踪你的研究贡献、能力等级和任务执行情况。</p></div>
      <div class="actions"><el-button :icon="Plus" @click="dailyOpen = true">提交日报</el-button><el-button type="primary" :icon="Aim" @click="vulnOpen = true">提交漏洞</el-button></div>
    </div>
    <section class="profile-strip panel">
      <div class="avatar">{{ profile.nickname?.slice(0, 1) }}</div>
      <div class="identity"><span class="eyebrow">ID // WH-{{ profile.id }}</span><h2>{{ profile.nickname }}</h2><div class="skills"><span v-for="s in (profile.skills || '').split(',').filter(Boolean)" :key="s">{{ s }}</span></div></div>
      <div class="level"><small>CURRENT CLEARANCE</small><b>LV.{{ profile.levelId }} {{ levels[profile.levelId] }}</b><div class="bar"><i :style="{ width: Math.min(100, (profile.score % 500) / 5) + '%' }"></i></div><span>{{ profile.score }} SECURITY POINTS</span></div>
    </section>
    <section class="profile-grid">
      <div>
        <div class="kpis"><div class="panel"><Trophy/><span><small>平台排名</small><b># {{ profile.rank }}</b></span></div><div class="panel"><Medal/><span><small>安全积分</small><b>{{ profile.score }}</b></span></div><div class="panel"><DocumentChecked/><span><small>完成任务</small><b>{{ profile.completedTasks }}</b></span></div><div class="panel"><Aim/><span><small>提交漏洞</small><b>{{ profile.vulnerabilities }}</b></span></div></div>
        <div class="panel timeline"><div class="panel-title"><h3>成长路径</h3><small>LEVEL MATRIX</small></div><div class="levels"><div v-for="(name, i) in levels.slice(1)" :key="name" :class="{ done: i + 1 <= profile.levelId, current: i + 1 === profile.levelId }"><i>{{ i + 1 }}</i><span><b>LV.{{ i + 1 }}</b><small>{{ name }}</small></span></div></div></div>
      </div>
      <aside class="panel leaderboard"><div class="panel-title"><h3>白帽积分排行榜</h3><small>TOP 20</small></div><ol><li v-for="(u, i) in rank" :key="u.id" :class="{ me: u.id === profile.id }"><em>{{ String(i + 1).padStart(2, '0') }}</em><div class="mini-avatar">{{ u.nickname?.slice(0, 1) }}</div><span><b>{{ u.nickname }}</b><small>LV.{{ u.levelId }} · {{ u.skills || '安全研究' }}</small></span><strong>{{ u.score }}</strong></li></ol></aside>
    </section>

    <el-dialog v-model="dailyOpen" title="提交任务日报" width="min(620px, 92vw)">
      <el-form label-position="top"><el-form-item label="所属任务"><el-select v-model="daily.taskId"><el-option v-for="t in tasks" :key="t.id" :label="t.title" :value="t.id"/></el-select></el-form-item><el-form-item label="日期"><el-input v-model="daily.reportDate" type="date"/></el-form-item><el-form-item label="今日工作内容"><el-input v-model="daily.workContent" type="textarea"/></el-form-item><el-form-item label="测试目标"><el-input v-model="daily.testTarget"/></el-form-item><el-form-item label="发现问题"><el-input v-model="daily.findings" type="textarea"/></el-form-item><el-form-item label="风险分析"><el-input v-model="daily.riskAnalysis" type="textarea"/></el-form-item><el-form-item label="明日计划"><el-input v-model="daily.nextPlan" type="textarea"/></el-form-item></el-form>
      <template #footer><el-button @click="dailyOpen = false">取消</el-button><el-button type="primary" @click="submitDaily">提交日报</el-button></template>
    </el-dialog>
    <el-dialog v-model="vulnOpen" title="提交漏洞报告" width="min(680px, 92vw)">
      <el-form label-position="top"><el-form-item label="所属任务"><el-select v-model="vuln.taskId"><el-option v-for="t in tasks" :key="t.id" :label="t.title" :value="t.id"/></el-select></el-form-item><el-form-item label="漏洞标题"><el-input v-model="vuln.title"/></el-form-item><el-form-item label="漏洞类型"><el-input v-model="vuln.vulnerabilityType" placeholder="例如：越权访问、SQL 注入"/></el-form-item><el-form-item label="影响资产"><el-input v-model="vuln.affectedAsset"/></el-form-item><el-form-item label="漏洞描述"><el-input v-model="vuln.description" type="textarea" :rows="3"/></el-form-item><el-form-item label="复现步骤"><el-input v-model="vuln.reproductionSteps" type="textarea" :rows="4"/></el-form-item><div class="vuln-row"><el-form-item label="风险等级"><el-select v-model="vuln.severity"><el-option label="低危" value="LOW"/><el-option label="中危" value="MEDIUM"/><el-option label="高危" value="HIGH"/><el-option label="严重" value="CRITICAL"/></el-select></el-form-item><el-form-item label="CVSS"><el-input-number v-model="vuln.cvssScore" :min="0" :max="10" :step="0.1"/></el-form-item></div></el-form>
      <template #footer><el-button @click="vulnOpen = false">取消</el-button><el-button type="primary" @click="submitVuln">提交审核</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.actions{display:flex;gap:7px}.vuln-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.profile-strip{display:flex;align-items:center;padding:24px;margin-bottom:12px}.avatar,.mini-avatar{display:grid;place-items:center;background:#15344a;color:#67ddf7;border:1px solid #2b7894}.avatar{width:78px;height:78px;font-size:28px;margin-right:20px}.identity{flex:1}.identity h2{font-size:22px;margin:5px 0 10px}.skills{display:flex;gap:6px}.skills span{font-size:10px;padding:4px 8px;background:#102331;border:1px solid #244156;color:#74cfe5}.level{width:320px}.level small,.level b,.level span{display:block}.level small,.level span{font:9px monospace;color:#688096}.level b{font-size:15px;margin:8px 0}.bar{height:5px;background:#142334;margin-bottom:7px}.bar i{display:block;height:100%;background:#39d5ff;box-shadow:0 0 8px #39d5ff}.profile-grid{display:grid;grid-template-columns:2fr 1fr;gap:12px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}.kpis>div{padding:17px;display:flex;gap:12px;align-items:center}.kpis svg{width:22px;color:#39d5ff}.kpis small,.kpis b{display:block}.kpis small{font-size:9px;color:#6e8297}.kpis b{font-size:18px;margin-top:3px}.levels{display:flex;padding:35px 25px 40px}.levels>div{flex:1;display:flex;align-items:center;position:relative}.levels>div:after{content:"";height:1px;background:#25394d;position:absolute;left:33px;right:3px}.levels>div:last-child:after{display:none}.levels i{width:30px;height:30px;border:1px solid #31475b;display:grid;place-items:center;font:11px monospace;color:#657b8f;z-index:2;background:#0b1521}.levels span{position:absolute;top:39px;left:0}.levels b,.levels small{display:block;font-size:9px;white-space:nowrap}.levels small{color:#6b8196;margin-top:3px}.levels .done i{background:#124154;color:#76e6ff;border-color:#2ca6ca}.levels .done:after{background:#2ca6ca}.levels .current i{box-shadow:0 0 15px #1b8db0}.leaderboard ol{list-style:none;margin:0;padding:8px 15px 15px}.leaderboard li{display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid #182839}.leaderboard li.me{background:#0d2534}.leaderboard em{font:10px monospace;color:#5f758b}.mini-avatar{width:28px;height:28px;font-size:10px}.leaderboard li span{flex:1;min-width:0}.leaderboard b,.leaderboard small{display:block}.leaderboard b{font-size:11px}.leaderboard small{font-size:8px;color:#60758a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.leaderboard strong{font:12px monospace;color:#48d9aa}
@media(max-width:900px){.profile-grid{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.page-head{display:block}.actions{margin-top:16px}.profile-strip{align-items:flex-start;flex-wrap:wrap}.avatar{width:58px;height:58px}.level{width:100%;margin-top:20px}.levels{overflow-x:auto}.levels>div{min-width:100px}.vuln-row{grid-template-columns:1fr}}
</style>
