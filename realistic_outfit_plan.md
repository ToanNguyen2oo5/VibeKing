# Kế hoạch: Trang phục truyền thống phải sát với thực tế

## Mô tả vấn đề

Hiện tại, các prompt sinh ảnh trong hệ thống (cả Gemini, Hugging Face, và Pollinations fallback) **thiếu mô tả cấu trúc chi tiết** của từng bộ trang phục. Prompt chỉ nêu tên gọi chung (ví dụ: "Áo tứ thân Kinh Bắc") và vài thông tin cơ bản (màu sắc, phụ kiện), dẫn đến AI tự "tưởng tượng" cấu trúc trang phục, khiến kết quả sinh ra **sai lệch so với thực tế lịch sử**.

### Ví dụ sai lệch điển hình:
| Trang phục | AI có thể sinh sai | Thực tế chính xác |
|---|---|---|
| Áo tứ thân | Áo liền thân, 2 tà giống áo dài hiện đại | 4 tà riêng biệt, 2 tà trước buộc nút chéo trước bụng, bên trong mặc yếm đào + váy đụp đen |
| Áo dài Huế | Áo dài 2 tà hiện đại | Áo ngũ thân (5 vạt), cổ dựng đứng, 5 cúc, tà cong nhẹ |
| Áo bà ba | Áo sơ mi bình thường | Dáng suông, xẻ tà hai bên hông, 2 túi to trước ngực, hàng nút dọc giữa, cổ tròn/tim/thìa |
| Áo the khăn xếp | Áo dài nam hiện đại | Áo ngũ thân nam, phom chữ A, tay chẽn, cổ đứng 4cm, quần ống rộng trắng |

## Nguyên nhân gốc rễ

1. **`trangphuc.json`** thiếu trường mô tả hình thái cấu trúc chi tiết (`mo_ta_cau_truc`) — chỉ có `mo_ta_ngan` (1 câu marketing) và `y_nghia` (văn hóa)
2. **`buildOutfitPrompt()`** trong [geminiImageService.js](file:///d:/M%C3%A1y%20t%C3%ADnh/VK-B%E1%BA%A3n%20g%E1%BB%91c/viet-phuc-remix%20-%20Copy/src/services/geminiImageService.js#L38-L83) chỉ truyền tên, màu sắc, chất liệu, phụ kiện → AI không biết trang phục trông ra sao
3. **Prompt fallback** (Pollinations/HF) cũng thiếu tương tự
4. **Không có negative prompt** để loại trừ các đặc điểm sai phổ biến

---

## Proposed Changes

### 1. Bổ sung dữ liệu cấu trúc trang phục vào `trangphuc.json`

#### [MODIFY] trangphuc.json

Thêm 2 trường mới cho mỗi outfit:

- **`mo_ta_cau_truc`** — Mô tả chi tiết cấu trúc vật lý của trang phục (tiếng Việt), dùng cho Gemini prompt
- **`mo_ta_cau_truc_en`** — Mô tả tương đương bằng tiếng Anh, dùng cho Pollinations/HF prompt
- **`negative_prompt_en`** — Các đặc điểm SAI cần tránh khi sinh ảnh (tiếng Anh)

Ví dụ cho Áo tứ thân:

```json
{
  "id": "ao_tu_than",
  "mo_ta_cau_truc": "Áo tứ thân gồm 4 tà vải riêng biệt: 2 tà sau khâu liền tạo sống áo, 2 tà trước để rời và buộc thắt nút chéo trước bụng. Bên trong mặc yếm đào màu đỏ/hồng lộ ra ở phần ngực. Giữa yếm và áo tứ thân có lớp áo cánh trắng mỏng. Phía dưới mặc váy đụp đen dài gần chấm gót. Thắt lưng bao (dải lụa) thắt ngang eo giữ cố định các lớp áo. Đầu vấn khăn mỏ quạ hoặc đội nón quai thao. Chân đi dép cong truyền thống.",
  "mo_ta_cau_truc_en": "Áo tứ thân (Four-panel traditional dress): consists of 4 separate fabric panels — 2 back panels sewn together at center back creating a spine seam, 2 front panels left unfastened and tied in a decorative knot at the front abdomen. Underneath: a yếm đào (red/pink silk halter bodice) is visible at the chest. Between the yếm and the outer áo tứ thân is a thin white inner blouse (áo cánh). Below: a váy đụp (long black wrap-around skirt reaching near ankles). A silk sash belt (thắt lưng bao) wraps around the waist securing all layers. Head: khăn mỏ quạ (crow-beak turban) or nón quai thao (wide-brimmed hat with chin strap). Feet: traditional curved-toe slippers (dép cong).",
  "negative_prompt_en": "modern ao dai, two-panel dress, western dress, no yếm underneath, bare chest, modern high heels, jeans, t-shirt"
}
```

> [!IMPORTANT]
> Dữ liệu mô tả cấu trúc được nghiên cứu từ các nguồn học thuật: Bảo tàng Dân tộc học Việt Nam, sách "Ngàn năm áo mũ" (Trần Quang Đức), "Trang phục Việt Nam" (Đoàn Thị Tình), Bảo tàng Cổ vật Cung đình Huế.

---

### 2. Nâng cấp prompt Gemini với mô tả cấu trúc chi tiết

#### [MODIFY] geminiImageService.js — hàm `buildOutfitPrompt()`

```diff
 function buildOutfitPrompt(outfitData, angle = 0, customizations = {}) {
   const colors = outfitData.mau_dac_trung.join(', ');
   const accessories = outfitData.phu_kien_di_kem.join(', ');
+  const structureDesc = outfitData.mo_ta_cau_truc || '';

   // ... (angleInstruction, customText giữ nguyên) ...

-  return `Tạo ảnh chân dung toàn thân chất lượng cao của nhân vật mặc trang phục "${outfitData.ten}".
+  return `Tạo ảnh chân dung toàn thân chất lượng cao của nhân vật mặc trang phục truyền thống Việt Nam "${outfitData.ten}".
+
+ĐẶC BIỆT QUAN TRỌNG — MÔ TẢ CẤU TRÚC TRANG PHỤC CHÍNH XÁC (phải tuân thủ 100%):
+${structureDesc}
 
 Chi tiết trang phục:
 - Tên: ${outfitData.ten}
 - Màu sắc chủ đạo: ${colors}
 - Chất liệu: ${outfitData.chat_lieu || 'truyền thống'}
 - Phụ kiện đi kèm: ${accessories}
 - Vùng miền: ${outfitData.vung_mien}
 ${customText}
 
 Yêu cầu ảnh:
-- Phong cách: chụp thời trang editorial, ánh sáng studio chuyên nghiệp ấm áp
-- Bối cảnh: phông nền Việt Nam đẹp, phù hợp với trang phục
+- Phong cách: chụp thời trang editorial, ánh sáng studio chuyên nghiệp ấm áp.
+- Bối cảnh: phông nền Việt Nam đẹp phù hợp vùng miền ${outfitData.vung_mien} (kiến trúc cổ, thiên nhiên, hoặc studio).
 - Nhân vật: trẻ trung (18-25 tuổi), tự tin, biểu cảm tự nhiên
 - ${angleInstruction}
-- Ảnh rõ nét, chi tiết trang phục chính xác, màu sắc sống động`;
+- Ảnh rõ nét, chi tiết trang phục CHÍNH XÁC theo mô tả cấu trúc ở trên, màu sắc sống động.
+- TUYỆT ĐỐI KHÔNG tự ý thay đổi cấu trúc trang phục (số tà áo, lớp áo bên trong, kiểu cổ, phụ kiện đầu).`;
 }
```

---

### 3. Nâng cấp prompt Hugging Face (FLUX PuLID)

#### [MODIFY] hfImageService.js — hàm `generateOutfitImageWithFaceHF()`

```diff
-  const prompt = `A highly detailed fashion editorial portrait of a young Vietnamese person wearing traditional ${outfitData.ten}, ${angleText}, ${customText}colors: ${outfitData.mau_dac_trung.join(', ')}. Cinematic lighting, professional studio photography, photorealistic, 8k resolution, highly detailed texture.`;
+  const structureEn = outfitData.mo_ta_cau_truc_en || `traditional Vietnamese ${outfitData.ten}`;
+  const prompt = `A highly detailed fashion editorial portrait of a young Vietnamese person wearing: ${structureEn}. ${angleText}, ${customText}colors: ${outfitData.mau_dac_trung.join(', ')}. Cinematic lighting, professional studio photography, photorealistic, 8k resolution, highly detailed textile texture.`;
```

Và bổ sung `negative_prompt` từ dữ liệu:

```diff
-    "bad quality, worst quality, text, signature, watermark, extra limbs", // neg_prompt
+    `bad quality, worst quality, text, signature, watermark, extra limbs, ${outfitData.negative_prompt_en || ''}`, // neg_prompt
```

---

### 4. Nâng cấp prompt Pollinations fallback

#### [MODIFY] geminiImageService.js — hàm `generateFallbackImage()`

```diff
-  const prompt = `A highly detailed fashion portrait of a young Vietnamese person wearing traditional ${outfitData.ten}, ${angleText} ${customText}colors: ${outfitData.mau_dac_trung.join(', ')}. Cinematic lighting, professional photography, photorealistic, 8k resolution.`;
+  const structureEn = outfitData.mo_ta_cau_truc_en || `traditional Vietnamese ${outfitData.ten}`;
+  const prompt = `A highly detailed fashion portrait of a young Vietnamese person wearing: ${structureEn}. ${angleText} ${customText}colors: ${outfitData.mau_dac_trung.join(', ')}. Cinematic lighting, professional photography, photorealistic, 8k resolution, authentic traditional Vietnamese garment construction.`;
```

---

## Tóm tắt thay đổi theo file

| File | Thay đổi |
|---|---|
| [trangphuc.json](file:///d:/M%C3%A1y%20t%C3%ADnh/VK-B%E1%BA%A3n%20g%E1%BB%91c/viet-phuc-remix%20-%20Copy/data/trangphuc.json) | Thêm 3 trường mới cho 5 trang phục: `mo_ta_cau_truc`, `mo_ta_cau_truc_en`, `negative_prompt_en` |
| [geminiImageService.js](file:///d:/M%C3%A1y%20t%C3%ADnh/VK-B%E1%BA%A3n%20g%E1%BB%91c/viet-phuc-remix%20-%20Copy/src/services/geminiImageService.js) | Cập nhật `buildOutfitPrompt()` và `generateFallbackImage()` |
| [hfImageService.js](file:///d:/M%C3%A1y%20t%C3%ADnh/VK-B%E1%BA%A3n%20g%E1%BB%91c/viet-phuc-remix%20-%20Copy/src/services/hfImageService.js) | Cập nhật prompt và negative_prompt |

---

## Verification Plan

### Automated Tests
```bash
npm run build
```
Build phải thành công, không lỗi syntax hay import.

### Manual Verification
1. Mở app trên trình duyệt, chọn bối cảnh → chọn từng trang phục → bấm tạo ảnh
2. Kiểm tra console log để xác nhận prompt mới đã chứa mô tả cấu trúc chi tiết
3. So sánh ảnh sinh ra với đặc điểm thực tế:
   - **Áo tứ thân**: Phải thấy 4 tà, 2 tà trước buộc nút, yếm đào bên trong, váy đụp đen
   - **Áo dài Huế**: Phải thấy cổ đứng, tà dài, nón bài thơ hoặc khăn vành dây
   - **Áo bà ba**: Phải thấy dáng suông, xẻ tà hai hông, 2 túi trước, khăn rằn
   - **Áo the khăn xếp**: Phải thấy phom chữ A, khăn xếp trên đầu, quạt giấy
   - **Áo dài cách tân**: Phải thấy tà ngắn hơn, phom hiện đại, phụ kiện trendy
