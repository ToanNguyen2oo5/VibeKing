import './OutfitSuggestions.css';

function getRegionBadgeClass(region) {
  const r = region.toLowerCase();
  if (r.includes('bắc') || r === 'bắc') return 'badge-bac';
  if (r.includes('trung') || r === 'trung') return 'badge-trung';
  if (r.includes('nam') || r === 'nam') return 'badge-nam';
  return 'badge-chung';
}

export default function OutfitSuggestions({ outfits, onSelect, selectedId }) {
  if (!outfits || outfits.length === 0) {
    return (
      <section className="outfit-suggestions" id="outfit-suggestions">
        <div className="outfit-suggestions__empty animate-fade-in">
          <span className="outfit-suggestions__empty-icon">👘</span>
          <p>Chọn bối cảnh ở trên để xem gợi ý trang phục</p>
        </div>
      </section>
    );
  }

  return (
    <section className="outfit-suggestions" id="outfit-suggestions">
      <div className="outfit-suggestions__header animate-fade-in-up">
        <span className="outfit-suggestions__label">Bước 2</span>
        <h2 className="outfit-suggestions__title">
          Gợi ý trang phục <span className="text-gradient">dành cho bạn</span>
        </h2>
        <p className="outfit-suggestions__subtitle">
          {outfits.length} trang phục phù hợp — chọn bộ bạn thích nhất
        </p>
      </div>

      <div className="outfit-grid">
        {outfits.map((outfit, index) => (
          <button
            key={outfit.id}
            className={`outfit-card glass-card animate-fade-in-up stagger-${index + 1} ${
              selectedId === outfit.id ? 'outfit-card--active' : ''
            }`}
            onClick={() => onSelect(outfit)}
            id={`outfit-${outfit.id}`}
          >
            {/* Color swatches */}
            <div className="outfit-card__colors">
              {outfit.mau_dac_trung.slice(0, 3).map((color, i) => (
                <span
                  key={i}
                  className="outfit-card__swatch"
                  title={color}
                  style={{ backgroundColor: colorNameToHex(color) }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="outfit-card__body">
              <span className={`badge ${getRegionBadgeClass(outfit.vung_mien)}`}>
                {outfit.vung_mien}
              </span>
              <h3 className="outfit-card__name">{outfit.ten}</h3>
              <p className="outfit-card__desc">{outfit.mo_ta_ngan}</p>
            </div>

            {/* Accessories preview */}
            <div className="outfit-card__accessories">
              {outfit.phu_kien_di_kem.slice(0, 3).map((acc, i) => (
                <span key={i} className="outfit-card__accessory-tag">
                  {acc}
                </span>
              ))}
            </div>

            {/* Gender indicator */}
            <span className="outfit-card__gender">
              {outfit.gioi_tinh === 'nữ' ? '♀' : outfit.gioi_tinh === 'nam' ? '♂' : '⚥'}
            </span>

            {selectedId === outfit.id && (
              <div className="outfit-card__selected-overlay">
                <span>✓ Đã chọn</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

/**
 * Convert Vietnamese color names to approximate hex values for swatches
 */
function colorNameToHex(name) {
  const colorMap = {
    'tím huế': '#7b2d8e',
    'tím': '#7b2d8e',
    'trắng': '#f5f5f0',
    'trắng ngà': '#faf0e6',
    'trắng kem': '#fdf5e6',
    'xanh ngọc bích': '#0f9b8e',
    'xanh ngọc': '#0f9b8e',
    'nâu non': '#c4a882',
    'nâu đất': '#8b6f47',
    'nâu gụ': '#5c3317',
    'đỏ thắm': '#cc1100',
    'đỏ son': '#cc1100',
    'vàng mỡ gà': '#f5d060',
    'vàng ánh kim': '#d4a017',
    'đen': '#1a1a1a',
    'đen classic': '#1a1a1a',
    'xanh thẫm': '#1a3a5c',
    'xanh cobalt': '#0047ab',
    'xanh lá đậm': '#1a5c2e',
    'pastel hồng': '#f4c2c2',
    'be': '#d4c5a9',
    'hồng': '#e75480',
  };

  const key = name.toLowerCase().trim();
  return colorMap[key] || '#888888';
}
