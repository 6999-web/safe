import axios from 'axios';
const client=axios.create({baseURL:'/api',timeout:12000});
client.interceptors.request.use(c=>{const token=localStorage.getItem('wh_token');if(token)c.headers.Authorization=`Bearer ${token}`;return c});
client.interceptors.response.use(r=>r.data.data,e=>Promise.reject(new Error(e.response?.data?.message||'网络请求失败')));
export const api={
 get:<T=any>(url:string,config?:any)=>client.get(url,config) as Promise<T>,
 post:<T=any>(url:string,data?:any,config?:any)=>client.post(url,data,config) as Promise<T>,
 put:<T=any>(url:string,data?:any,config?:any)=>client.put(url,data,config) as Promise<T>
};
