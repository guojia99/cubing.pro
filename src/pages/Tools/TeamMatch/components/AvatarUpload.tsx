import { processAvatarFile } from '@/pages/Tools/TeamMatch/utils/avatar';
import { Button, Modal, Upload } from 'antd';
import React, { useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function canvasPreview(image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const sx = crop.x * scaleX;
  const sy = crop.y * scaleY;
  const sw = crop.width * scaleX;
  const sh = crop.height * scaleY;
  canvas.width = crop.width;
  canvas.height = crop.height;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
}

async function cropToDataUrl(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
  const canvas = document.createElement('canvas');
  canvasPreview(image, canvas, crop);
  const maxSide = 256;
  let w = canvas.width;
  let h = canvas.height;
  if (w > h) {
    if (w > maxSide) {
      h = (h * maxSide) / w;
      w = maxSide;
    }
  } else if (h > maxSide) {
    w = (w * maxSide) / h;
    h = maxSide;
  }
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(w));
  out.height = Math.max(1, Math.round(h));
  const ctx = out.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/jpeg', 0.82);
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/jpeg', 0.82);
}

type Props = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
};

const AvatarUpload: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [pixelCrop, setPixelCrop] = useState<PixelCrop>();
  const imgRef = React.useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const c = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width,
      height,
    );
    setCrop(c);
  };

  const handleOk = async () => {
    if (!imgRef.current || !pixelCrop?.width) {
      setOpen(false);
      return;
    }
    const url = await cropToDataUrl(imgRef.current, pixelCrop);
    onChange(url);
    setOpen(false);
    setSrc(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {value ? (
          <img alt="" src={value} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f0f0f0' }} />
        )}
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={(file) => {
            const r = new FileReader();
            r.onload = () => {
              setSrc(r.result as string);
              setOpen(true);
            };
            r.readAsDataURL(file);
            return false;
          }}
        >
          <Button size="small">选择图片</Button>
        </Upload>
        {value && (
          <Button size="small" danger type="link" onClick={() => onChange(null)}>
            清除
          </Button>
        )}
      </div>
      <Modal
        title="裁剪头像"
        open={open}
        onOk={() => void handleOk()}
        onCancel={() => {
          setOpen(false);
          setSrc(null);
        }}
        destroyOnClose
      >
        {src && (
          <ReactCrop
            crop={crop}
            onChange={(_, p) => setCrop(p)}
            onComplete={(c) => setPixelCrop(c)}
            aspect={1}
          >
            <img ref={imgRef} alt="" src={src} onLoad={onImageLoad} style={{ maxWidth: '100%' }} />
          </ReactCrop>
        )}
      </Modal>
    </div>
  );
};

export default AvatarUpload;
