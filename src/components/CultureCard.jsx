import { useState, useEffect } from 'react';
import { generateCultureDescription } from '../services/geminiTextService';
import './CultureCard.css';

export default function CultureCard({ outfit, customizations, useDemoData = false }) {
  const [cultureInfo, setCultureInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!outfit) return;

    if (useDemoData) {
      // Demo mode: dùng dữ liệu gốc
      setCultureInfo({
        ten: outfit.ten,
        y_nghia_dien_giai: outfit.y_nghia,
        boi_canh_de_xuat: `Phù hợp cho: ${outfit.boi_canh_phu_hop.join(', ')}`,
        fun_fact: `Trang phục với màu sắc đặc trưng ${outfit.mau_dac_trung[0]} — biểu tượng của vùng ${outfit.vung_mien}.`
      });
      return;
    }

    // Gọi Gemini API
    const fetchCultureInfo = async () => {
      setIsLoading(true);
      try {
        const data = await generateCultureDescription(outfit);
        setCultureInfo(data);
      } catch (err) {
        console.error('Lỗi sinh mô tả văn hóa:', err);
        // Fallback
        setCultureInfo({
          ten: outfit.ten,
          y_nghia_dien_giai: outfit.y_nghia,
          boi_canh_de_xuat: `Phù hợp cho: ${outfit.boi_canh_phu_hop.join(', ')}`,
          fun_fact: `Trang phục với màu sắc đặc trưng ${outfit.mau_dac_trung[0]}.`
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCultureInfo();
  }, [outfit, useDemoData]);

  if (!outfit) return null;

  const regionBadge = getRegionClass(outfit.vung_mien);

  // Tính điểm phong cách
  const scores = (() => {
    let authentic = 95;
    let remix = 5;
    
    if (customizations) {
      if (customizations.fit && customizations.fit !== 'Vừa vặn') {
        authentic -= 15;
        remix += 20;
      }
      if (customizations.collar && customizations.collar !== 'Truyền thống') {
        authentic -= 25;
        remix += 30;
      }
      if (customizations.sleeve && customizations.sleeve !== 'Dài tay') {
        authentic -= 15;
        remix += 20;
      }
    }
    return {
      authentic: Math.max(10, authentic),
      remix: Math.min(100, remix),
      harmony: 90 + Math.floor(Math.random() * 10) // 90-100
    };
  })();

  return (
    <div className={`culture-card glass-panel animate-fade-in-up ${expanded ? 'culture-card--expanded' : ''}`} id="culture-card">
      {/* Header */}
      <div className="culture-card__header">
        <div className="culture-card__title-row">
          <span className={`badge ${regionBadge}`}>{outfit.vung_mien}</span>
          <h3 className="culture-card__title">
            {isLoading ? <span className="skeleton" style={{ width: 200, height: 24 }} /> : (cultureInfo?.ten || outfit.ten)}
          </h3>
        </div>
        {outfit.gioi_tinh && (
          <span className="culture-card__gender-tag">
            {outfit.gioi_tinh === 'nữ' ? '👩 Nữ' : outfit.gioi_tinh === 'nam' ? '👨 Nam' : '⚥ Unisex'}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="culture-card__body">
        {isLoading ? (
          <div className="culture-card__skeleton">
            <span className="skeleton" style={{ width: '100%', height: 16 }} />
            <span className="skeleton" style={{ width: '90%', height: 16 }} />
            <span className="skeleton" style={{ width: '75%', height: 16 }} />
          </div>
        ) : (
          <>
            <div className="culture-card__section">
              <span className="culture-card__icon">📖</span>
              <div>
                <h4 className="culture-card__section-title">Ý nghĩa</h4>
                <p className="culture-card__text">{cultureInfo?.y_nghia_dien_giai}</p>
              </div>
            </div>

            <div className="culture-card__section">
              <span className="culture-card__icon">🎯</span>
              <div>
                <h4 className="culture-card__section-title">Bối cảnh phù hợp</h4>
                <p className="culture-card__text">{cultureInfo?.boi_canh_de_xuat}</p>
              </div>
            </div>

            {cultureInfo?.fun_fact && (
              <div className="culture-card__section culture-card__fun-fact">
                <span className="culture-card__icon">💡</span>
                <div>
                  <h4 className="culture-card__section-title">Fun fact</h4>
                  <p className="culture-card__text">{cultureInfo.fun_fact}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Bảng điểm phong cách */}
        <div className="culture-card__scores">
          <h4 className="culture-card__scores-title">✨ Chấm điểm Phong cách</h4>
          
          <div className="score-item">
            <div className="score-label">
              <span>Tôn trọng Nguyên bản (Authentic)</span>
              <span>{scores.authentic}%</span>
            </div>
            <div className="score-bar">
              <div className="score-fill score-fill--authentic" style={{ width: `${scores.authentic}%` }}></div>
            </div>
          </div>

          <div className="score-item">
            <div className="score-label">
              <span>Độ Phá cách (Gen Z Remix)</span>
              <span>{scores.remix}%</span>
            </div>
            <div className="score-bar">
              <div className="score-fill score-fill--remix" style={{ width: `${scores.remix}%` }}></div>
            </div>
          </div>

          <div className="score-item">
            <div className="score-label">
              <span>Hài hòa Tổng thể</span>
              <span>{scores.harmony}%</span>
            </div>
            <div className="score-bar">
              <div className="score-fill score-fill--harmony" style={{ width: `${scores.harmony}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Details toggle */}
      <button
        className="culture-card__toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="culture-card__details animate-fade-in-up">
          {/* Structure */}
          {outfit.mo_ta_cau_truc && (
            <div className="culture-card__detail-row">
              <span className="culture-card__detail-label">🏛️ Cấu trúc chuẩn xác</span>
              <p className="culture-card__detail-value" style={{ margin: 0, lineHeight: 1.6 }}>
                {outfit.mo_ta_cau_truc}
              </p>
            </div>
          )}

          {/* Colors */}
          <div className="culture-card__detail-row">
            <span className="culture-card__detail-label">🎨 Màu sắc</span>
            <div className="culture-card__colors">
              {outfit.mau_dac_trung.map((color, i) => (
                <span key={i} className="culture-card__color-chip">{color}</span>
              ))}
            </div>
          </div>

          {/* Accessories */}
          <div className="culture-card__detail-row">
            <span className="culture-card__detail-label">👒 Phụ kiện</span>
            <div className="culture-card__colors">
              {outfit.phu_kien_di_kem.map((acc, i) => (
                <span key={i} className="culture-card__color-chip">{acc}</span>
              ))}
            </div>
          </div>

          {/* Material */}
          {outfit.chat_lieu && (
            <div className="culture-card__detail-row">
              <span className="culture-card__detail-label">🧵 Chất liệu</span>
              <span className="culture-card__detail-value">{outfit.chat_lieu}</span>
            </div>
          )}

          {/* Source */}
          <div className="culture-card__source">
            <span className="culture-card__source-label">📚 Nguồn tham khảo</span>
            <p className="culture-card__source-text">{outfit.nguon_tham_khao}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function getRegionClass(region) {
  const r = region.toLowerCase();
  if (r.includes('bắc') || r === 'bắc') return 'badge-bac';
  if (r.includes('trung') || r === 'trung') return 'badge-trung';
  if (r.includes('nam') || r === 'nam') return 'badge-nam';
  return 'badge-chung';
}
