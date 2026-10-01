import { GoogleGenAI } from '@google/genai';
import { generateOutfitImageWithFaceHF } from './hfImageService';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

let ai = null;
function getAI() {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('Vui lòng cấu hình VITE_GEMINI_API_KEY trong file .env');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const IMAGE_MODEL = 'gemini-3.1-flash-image'; // model sinh ảnh theo yêu cầu

/**
 * Chuyển File/Blob thành base64 string (không có prefix data:...)
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Tạo prompt mô tả outfit chi tiết cho Gemini
 */
function buildOutfitPrompt(outfitData, angle = 0, customizations = {}) {
  const colors = outfitData.mau_dac_trung.join(', ');
  const accessories = outfitData.phu_kien_di_kem.join(', ');

  let angleInstruction = '';
  if (angle === 0) {
    angleInstruction = 'Nhân vật đứng đối diện camera, nhìn thẳng từ phía trước (Front view).';
  } else if (angle === 90) {
    angleInstruction = 'Nhân vật xoay người 90 độ, nhìn từ mặt bên hông phải (Right side profile view).';
  } else if (angle === 180) {
    angleInstruction = 'Nhân vật quay lưng lại với camera, nhìn từ phía sau lưng (Back view).';
  } else if (angle === 270) {
    angleInstruction = 'Nhân vật xoay người 270 độ, nhìn từ mặt bên hông trái (Left side profile view).';
  } else {
    angleInstruction = `Xoay góc nhìn nhân vật sang ${angle} độ.`;
  }

  let customText = '';
  if (customizations && Object.keys(customizations).length > 0) {
    customText = `
Yêu cầu tùy chỉnh phom dáng từ người dùng:
- Độ ôm: ${customizations.fit || 'Vừa vặn'}
- Độ dài tà áo: ${customizations.length || 'Trung bình'}
- Kiểu cổ áo: ${customizations.collar || 'Truyền thống'}
- Kiểu tay áo: ${customizations.sleeve || 'Dài tay'}
- Chiều cao người mặc: ${customizations.height ? customizations.height + ' cm' : 'Không rõ'} (hãy cân đối tỷ lệ cho phù hợp)
`;
  }

  return `Tạo ảnh chân dung toàn thân chất lượng cao của nhân vật mặc trang phục "${outfitData.ten}".

Chi tiết trang phục:
- Tên: ${outfitData.ten}
- Màu sắc chủ đạo: ${colors}
- Chất liệu: ${outfitData.chat_lieu || 'truyền thống'}
- Phụ kiện đi kèm: ${accessories}
- Vùng miền: ${outfitData.vung_mien}
${customText}

Yêu cầu ảnh:
- Phong cách: chụp thời trang editorial, ánh sáng studio chuyên nghiệp ấm áp
- Bối cảnh: phông nền Việt Nam đẹp, phù hợp với trang phục (kiến trúc cổ, thiên nhiên, hoặc studio)
- Nhân vật: trẻ trung (18-25 tuổi), tự tin, biểu cảm tự nhiên
- ${angleInstruction}
- Ảnh rõ nét, chi tiết trang phục chính xác, màu sắc sống động`;
}

/**
 * Sinh ảnh mockup nhân vật mặc trang phục ở một góc cụ thể
 * @param {string|null} userPhotoBase64 - Ảnh người dùng dạng base64 (null nếu dùng nhân vật mẫu)
 * @param {object} outfitData - Dữ liệu outfit từ trangphuc.json
 * @param {number} angle - Góc xoay (0, 45, 90, 135, 180, 225, 270, 315)
 * @param {string|null} referenceImageBase64 - Ảnh tham chiếu (ảnh góc 0°) cho các góc sau
 * @returns {Promise<string>} base64 image data
 */
export async function generateOutfitImage(userPhotoBase64, outfitData, angle = 0, referenceImageBase64 = null, customizations = {}) {
  if (DEMO_MODE) {
    return getDemoImage(outfitData.id, angle);
  }

  // Nếu người dùng upload ảnh mặt, sử dụng Hugging Face FLUX PuLID
  if (userPhotoBase64) {
    console.log('Sử dụng Hugging Face FLUX PuLID cho:', outfitData.ten);
    return await generateOutfitImageWithFaceHF(userPhotoBase64, outfitData, angle, customizations);
  }

  const genAI = getAI();
  const prompt = buildOutfitPrompt(outfitData, angle, customizations);

  const contents = [];

  // Build parts array
  const parts = [];

  // Thêm ảnh người dùng nếu có
  if (userPhotoBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: userPhotoBase64
      }
    });
    parts.push({
      text: 'QUAN TRỌNG: Đây là ảnh khuôn mặt tham chiếu. Bạn PHẢI giữ nguyên chính xác các đường nét khuôn mặt, mắt, mũi, miệng, kiểu tóc và kính (nếu có) của người này và ghép vào nhân vật trong ảnh kết quả.'
    });
  }

  // Thêm ảnh tham chiếu nếu đang sinh góc xoay
  if (referenceImageBase64 && angle !== 0) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: referenceImageBase64
      }
    });
    parts.push({
      text: `QUAN TRỌNG: Đây là ảnh nhân vật ở góc 0 độ. Bạn PHẢI giữ nguyên khuôn mặt (nhìn từ góc ${angle} độ), trang phục, phom dáng và màu sắc. Chỉ thay đổi góc nhìn sang ${angle} độ.`
    });
  }

  parts.push({ text: prompt });

  contents.push({ role: 'user', parts });

  try {
    const response = await genAI.models.generateContent({
      model: IMAGE_MODEL,
      contents: contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error('Gemini không trả về ảnh.');
  } catch (error) {
    console.warn('Gemini API thất bại (có thể hết Quota). Đang chuyển sang Fallback API (Pollinations.ai)...', error.message);
    return await generateFallbackImage(outfitData, angle, customizations);
  }
}

/**
 * Dịch tùy chọn sang tiếng Anh cho Pollinations.ai
 */
function translateCustomizations(cust) {
  if (!cust) return '';
  
  const fitMap = {
    'Ôm sát': 'tight form-fitting',
    'Vừa vặn': 'regular fit well-tailored',
    'Rộng rãi': 'loose oversized comfortable fit'
  };
  
  const lengthMap = {
    'Ngắn (qua gối)': 'short knee-length',
    'Trung (giữa bắp chân)': 'midi calf-length',
    'Dài (chấm gót)': 'long floor-length flowing'
  };
  
  const collarMap = {
    'Truyền thống': 'traditional collar',
    'Cổ thuyền': 'boat neck',
    'Cổ trụ cách tân': 'mandarin stand collar'
  };
  
  const sleeveMap = {
    'Dài tay': 'long sleeves',
    'Tay lỡ': 'half elbow-length sleeves',
    'Tay ngắn cách tân': 'short sleeves'
  };

  const parts = [];
  if (cust.fit && fitMap[cust.fit]) parts.push(fitMap[cust.fit]);
  if (cust.length && lengthMap[cust.length]) parts.push(lengthMap[cust.length]);
  if (cust.collar && collarMap[cust.collar]) parts.push(collarMap[cust.collar]);
  if (cust.sleeve && sleeveMap[cust.sleeve]) parts.push(sleeveMap[cust.sleeve]);
  
  return parts.join(', ');
}

/**
 * Fallback sinh ảnh bằng Pollinations.ai (Free API, no key required)
 */
async function generateFallbackImage(outfitData, angle = 0, customizations = {}) {
  let angleText = 'front view, facing camera, ';
  if (angle === 90) angleText = 'side profile view, facing right, ';
  else if (angle === 180) angleText = 'back view, seen from behind, ';
  else if (angle === 270) angleText = 'side profile view, facing left, ';

  let customText = translateCustomizations(customizations);
  if (customText) customText += ', ';

  // Random seed để các góc không bị trùng ảnh nếu prompt quá giống nhau
  const seed = Math.floor(Math.random() * 100000);

  const prompt = `A highly detailed fashion portrait of a young Vietnamese person wearing traditional ${outfitData.ten}, ${angleText} ${customText}colors: ${outfitData.mau_dac_trung.join(', ')}. Cinematic lighting, professional photography, photorealistic, 8k resolution.`;
  const encodedPrompt = encodeURIComponent(prompt);
  
  // Trả URL trực tiếp — thẻ <img> sẽ tự tải (không bị CORS chặn)
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=768&nologo=true&seed=${seed}`;
}



/**
 * Load ảnh demo từ /public/generated/
 */
async function getDemoImage(outfitId, angle) {
  const url = `/generated/${outfitId}_${angle}deg.png`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Trả về placeholder nếu ảnh chưa có
      return null;
    }
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch {
    return null;
  }
}

/**
 * Load bộ ảnh turntable demo
 */
async function getDemoTurntableSet(outfitId) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const images = await Promise.all(
    angles.map(angle => getDemoImage(outfitId, angle))
  );
  return images;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
