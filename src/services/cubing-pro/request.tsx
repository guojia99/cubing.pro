import axios from "axios";
import type {AxiosError, AxiosResponse} from 'axios';
import {WarnToast} from "@/components/Alert/toast";

const dev = false

export function getAPIUrl() {
  if (dev){
    return "http://106.53.77.214/v3/cube-api"
  }

  const hostname = window.location.hostname;
  // 本地测试
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === '0.0.0.0') {
    return "http://127.0.0.1:20000/v3/cube-api"
  }
  // // 内网测试
  // if (/^192\.168/.test(hostname) || /^10./.test(hostname)) {
  //   return window.location.protocol + "//" + hostname + ":20000/v3/cube-api"
  // }
  // 正式网络
  return window.location.protocol + "//" + hostname + ":" + window.location.port + "/v3/cube-api"
}

export function isLocal() : boolean{
  const hostname = window.location.hostname;
  // 本地测试
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === '0.0.0.0') {
    return true
  }
  return /^192\.168/.test(hostname) || /^10./.test(hostname);
}


export type  ErrorMsg = {
  code: number,
  http_code: number;
  message: string,
  level: string;
  ref: string;
  line: string;
  data: any;
}

export const Request = axios.create({
  baseURL: getAPIUrl(),
  timeout: 900000,
});
Request.defaults.timeout = 900000;

Request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const resp = error.response
    if (resp === undefined) {
      return Promise.reject(error);
    }
    console.log(resp)
    const msg = resp.data as ErrorMsg
    if (msg !== undefined) {
      WarnToast(<>错误: {msg.message} ({msg.code}) </>)
    } else {
      // const url = error.config?.url
      if (isLocal()){
        // message.warning("错误: " + url + "| (" + msg + ")").then()
        // WarnToast(<>未知错误: {url} ({status})</>)
      }
    }
    return Promise.reject(error);
  },
)
