import { toast } from 'react-toastify';
export const WarnToast = (msg) => {
    toast.warning(msg, {
        position: "top-right",
        autoClose: 15000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
    });
};
export const SuccessToast = (msg) => {
    toast.success(msg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
    });
};
export const WaitToast = async (wait, pending, success, error) => {
    toast.promise(wait, {
        pending: pending,
        success: success,
        error: error
    }, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
    }).then();
};
//# sourceMappingURL=toast.jsx.map