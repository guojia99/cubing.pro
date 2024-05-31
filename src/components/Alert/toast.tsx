import {toast} from 'react-toastify'
import {JSX} from "react";

export const WarnToast = (msg: JSX.Element | string) => {
  toast.warning(msg,
    {
      position: "top-right",
      autoClose: 15000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    })
}


export const SuccessToast = (msg: JSX.Element | string) => {
  toast.success(msg, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  })
}


export const WaitToast = async (
  wait: Promise<any>,
  pending: JSX.Element | string,
  success: JSX.Element | string,
  error: JSX.Element | string
) => {
  toast.promise(
    wait,
    {
      pending: pending,
      success: success,
      error: error
    },
    {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    }
  ).then()
}
