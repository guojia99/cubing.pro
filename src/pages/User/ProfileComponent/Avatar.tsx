import { AvatarURL } from '@/pages/User/AvatarDropdown';
import { updateAvatar } from '@/services/cubing-pro/auth/auth';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Input, Modal, Spin, Tabs, TabsProps, Upload, message } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import React, { useCallback, useRef, useState } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function AvatarWithUpdate(user: AuthAPI.CurrentUser) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    height: 0,
    x: 0,
    y: 0,
    unit: '%',
    width: 30,
    // @ts-ignore
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    if (uploading) {
      return;
    }

    setIsModalVisible(false);
    setImageUrl('');
    setUploadedImage(null);
    // @ts-ignore
    setCrop({ height: 0, x: 0, y: 0, unit: '%', width: 30, aspect: 1 });
    setCompletedCrop(null);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleUpload = (file: RcFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        setUploadedImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const getCroppedImg = useCallback((image: HTMLImageElement, crop: Crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width!;
    canvas.height = crop.height!;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        image,
        crop.x! * scaleX,
        crop.y! * scaleY,
        crop.width! * scaleX,
        crop.height! * scaleY,
        0,
        0,
        crop.width!,
        crop.height!,
      );
    }

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  }, []);

  async function checkLink(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD', // 使用 HEAD 请求以节省带宽，不会获取实际内容
      });

      // 检查状态码是否为 200，表示请求成功
      return response.ok;
    } catch (error) {
      console.error('请求失败:', error);
      return false;
    }
  }

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1]; // 去掉前缀部分
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  // todo 抽一层
  const handleSubmit = useCallback(async () => {
    setUploading(true);
    if (imageUrl && imageUrl !== '') {
      let check = await checkLink(imageUrl);
      if (!check) {
        setUploading(true);
        return;
      }
    }

    let req = {
      URL: imageUrl,
      ImageName: '',
      Data: '',
    };

    if (completedCrop && imgRef.current) {
      try {
        const croppedImg = await getCroppedImg(imgRef.current, completedCrop);
        req.Data = await convertBlobToBase64(croppedImg);
        req.ImageName = '头像.jpeg';
      } catch (e) {
        message.error('图像解析失败');
      }
    }

    await updateAvatar(req)
      .then(() => {
        message.success('上传成功');
        window.location.reload();
      })
      .catch((err) => {
        message.error('上传失败');
        console.log(err);
      });
    setUploading(false);
    // handleCancel();
  }, [imageUrl, completedCrop, getCroppedImg]);

  const items: TabsProps['items'] = [
    {
      key: 'upload_file',
      label: '文件上传',
      children: (
        <div>
          <Upload beforeUpload={handleUpload}>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          {uploadedImage && (
            <ReactCrop
              // @ts-ignore
              src={uploadedImage}
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <img ref={imgRef} src={uploadedImage} alt="更新头像" />
            </ReactCrop>
          )}
        </div>
      ),
    },
    {
      key: 'upload_url',
      label: '链接上传',
      children: (
        <div>
          <Input
            placeholder="你的远程头像链接(注意是否可访问)"
            value={imageUrl}
            onChange={handleUrlChange}
          />
          {imageUrl && (
            <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', marginTop: '10px' }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: '20px', textAlign: 'center' }}>
        <Avatar
          style={{ backgroundColor: '#68d0ce' }}
          size={{ xs: 100, sm: 100, md: 100, lg: 100, xl: 120, xxl: 120 }}
          src={<img src={AvatarURL(user.data.Avatar)} alt="" />}
          icon={<UserOutlined />}
          onClick={showModal}
        />
        <h3 style={{ marginTop: '20px' }}>
          <strong>{user.data.Name}</strong>
        </h3>
      </Card>

      <Modal
        title="更新头像"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        maskClosable={!uploading}
        closable={!uploading}
        okButtonProps={{ disabled: uploading }}
        cancelButtonProps={{ disabled: uploading }}
      >
        <Spin size="large" tip={'上传中...'} spinning={uploading}>
          <Tabs items={items} />
        </Spin>
      </Modal>
    </div>
  );
}
