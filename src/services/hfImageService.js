import { Client } from "@gradio/client";

const SLEEVE_MAP = {
  'Dài tay': 'long sleeves',
  'Tay lỡ': 'half elbow-length sleeves',
  'Tay ngắn cách tân': 'short sleeves'
};
const COLLAR_MAP = {
  'Truyền thống': 'traditional collar',
  'Cổ thuyền': 'boat neck',
  'Cổ trụ cách tân': 'mandarin stand collar'
};
const LENGTH_MAP = {
  'Ngắn (qua gối)': 'short knee-length',
  'Trung (giữa bắp chân)': 'midi calf-length',
  'Dài (chấm gót)': 'long floor-length flowing'
};
const FIT_MAP = {
  'Ôm sát': 'tight form-fitting',
  'Vừa vặn': 'regular fit well-tailored',
  'Rộng rãi': 'loose oversized comfortable fit'
};

function translateCustomizations(cust) {
  if (!cust) return '';
  const parts = [];
  if (cust.fit && FIT_MAP[cust.fit]) parts.push(FIT_MAP[cust.fit]);
  if (cust.length && LENGTH_MAP[cust.length]) parts.push(LENGTH_MAP[cust.length]);
  if (cust.collar && COLLAR_MAP[cust.collar]) parts.push(COLLAR_MAP[cust.collar]);
  if (cust.sleeve && SLEEVE_MAP[cust.sleeve]) parts.push(SLEEVE_MAP[cust.sleeve]);
  return parts.join(', ');
}

function base64ToBlob(base64, mimeType = 'image/jpeg') {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

export async function generateOutfitImageWithFaceHF(userPhotoBase64, outfitData, angle = 0, customizations = {}) {
  // Chuyển góc nhìn
  let angleText = 'front view, facing camera';
  if (angle === 90) angleText = 'side profile view, facing right';
  else if (angle === 180) angleText = 'back view, seen from behind';
  else if (angle === 270) angleText = 'side profile view, facing left';

  // Chuyển tùy chỉnh trang phục
  let customText = translateCustomizations(customizations);
  if (customText) customText += ', ';

  const structureEn = outfitData.mo_ta_cau_truc_en || `traditional Vietnamese ${outfitData.ten}`;
  const prompt = `A highly detailed fashion editorial portrait of a young Vietnamese person wearing: ${structureEn}. ${angleText}, ${customText}colors: ${outfitData.mau_dac_trung.join(', ')}. Cinematic lighting, professional studio photography, photorealistic, 8k resolution, highly detailed textile texture.`;
  
  const faceBlob = base64ToBlob(userPhotoBase64);

  // Tham số chuẩn của yanze/PuLID-FLUX
  // prompt, id_image, start_step, guidance, seed, true_cfg, width, height, num_steps, id_weight, neg_prompt, timestep_to_start_cfg, max_sequence_length
  const inputs = [
    prompt,
    faceBlob,
    4,        // start_step
    4,        // guidance
    -1,       // seed (random)
    1,        // true_cfg
    896,      // width
    1152,     // height
    20,       // num_steps
    1.0,      // id_weight
    `bad quality, worst quality, text, signature, watermark, extra limbs${outfitData.negative_prompt_en ? ', ' + outfitData.negative_prompt_en : ''}`, // neg_prompt
    1,        // timestep_to_start_cfg
    128       // max_sequence_length
  ];

  console.log("Đang kết nối tới Hugging Face Space (yanze/PuLID-FLUX)... Quá trình này có thể mất 1-3 phút nếu server đang ngủ.");
  
  try {
    const hfToken = import.meta.env.VITE_HF_TOKEN;
    const connectOptions = {};
    if (hfToken && hfToken !== 'your_hf_token_here') {
      connectOptions.token = hfToken;
      connectOptions.hf_token = hfToken;
    }

    const client = await Client.connect("yanze/PuLID-FLUX", connectOptions);
    console.log("Đã kết nối! Đang gửi yêu cầu sinh ảnh...");
    
    const result = await client.predict("generate_image", inputs);
    
    if (result && result.data && result.data[0]) {
      // result.data[0] là URL của ảnh kết quả
      const imageUrl = result.data[0].url || result.data[0];
      
      // Chuyển URL thành Base64
      const imageRes = await fetch(imageUrl);
      const blob = await imageRes.blob();
      
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      throw new Error("Không nhận được ảnh từ Hugging Face");
    }
  } catch (err) {
    console.error("Lỗi Hugging Face API:", err);
    throw new Error("Hugging Face API thất bại: " + err.message);
  }
}
