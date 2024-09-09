// @ts-ignore
import CryptoJS from "crypto-js"


const SECRET = "cubing.pro.pro.."
const IV = "cubing.pro.pro.."

/**
 * @name AES-加密
 * @param raw 待加密字段
 * @param AESKey AES Key
 * @return {string} 返回加密字段
 */
export const aesEncrypt = (raw: any, AESKey: string): string => {
  const cypherKey = CryptoJS.enc.Utf8.parse(AESKey);
  CryptoJS.pad.ZeroPadding.pad(cypherKey, 4);

  const iv = CryptoJS.SHA256(AESKey).toString();
  const cfg = {iv: CryptoJS.enc.Utf8.parse(iv)};
  return CryptoJS.AES.encrypt(raw, cypherKey, cfg).toString();
}

/**
 * @name AES-解密
 * @param raw 待解密数据
 * @param AESKey 解密 key
 * @returns {string} 返回解密字符串
 */
export const aesDecrypt = (raw: string, AESKey: string): string => {
  const cypherKey = CryptoJS.enc.Utf8.parse(AESKey);
  CryptoJS.pad.ZeroPadding.pad(cypherKey, 4);

  const iv = CryptoJS.SHA256(AESKey).toString();
  const cfg = {iv: CryptoJS.enc.Utf8.parse(iv)};

  const decrypt = CryptoJS.AES.decrypt(raw, cypherKey, cfg);
  return CryptoJS.enc.Utf8.stringify(decrypt).toString();
}

/*
func (receiver *basicUtils) AesDecrypt(str string) string {
	// 将加密字符串转换为字节数组
	encryptedData, _ := base64.StdEncoding.DecodeString(str)
	// 创建一个新的AES解密器
	key := []byte(global.GVA_CONFIG.App.Secret)  // 密钥与前端保持一致
	iv := []byte(global.GVA_CONFIG.App.SecretIv) // 偏移量与前端保持一致
	block, _ := aes.NewCipher(key)

	// 使用CBC模式解密
	mode := cipher.NewCBCDecrypter(block, iv)

	decryptedData := make([]byte, len(encryptedData))
	mode.CryptBlocks(decryptedData, encryptedData)

	// 移除填充
	padding := int(decryptedData[len(decryptedData)-1])
	decryptedData = decryptedData[:len(decryptedData)-padding]
	// 将解密后的字节数组转换为字符串
	decryptedStr := string(decryptedData)
	return decryptedStr
}
* */
