import { useState } from 'react';
import './SceneSelector.css';

const SCENES = [
  { id: 'tet', name: 'Tết', icon: '🏮', desc: 'Xuân về rộn ràng' },
  { id: 'dam-cuoi', name: 'Đám cưới', icon: '💒', desc: 'Ngày trọng đại' },
  { id: 'ky-yeu', name: 'Kỷ yếu', icon: '📸', desc: 'Khoảnh khắc tuổi trẻ' },
  { id: 'le-hoi', name: 'Lễ hội', icon: '🎊', desc: 'Sắc màu văn hóa' },
  { id: 'dao-pho', name: 'Dạo phố', icon: '🌆', desc: 'Thanh lịch đường phố' },
  { id: 'chup-anh-di-san', name: 'Chụp ảnh di sản', icon: '🏛️', desc: 'Tôn vinh di sản' },
];

const REGIONS = [
  { id: 'all', name: 'Tất cả', emoji: '🇻🇳' },
  { id: 'bac', name: 'Miền Bắc', emoji: '🏔️' },
  { id: 'trung', name: 'Miền Trung', emoji: '🌊' },
  { id: 'nam', name: 'Miền Nam', emoji: '🌴' },
];

export default function SceneSelector({ onSceneSelect, onRegionSelect, selectedScene, selectedRegion }) {
  return (
    <section className="scene-selector" id="scene-selector">
      <div className="scene-selector__header animate-fade-in-up">
        <span className="scene-selector__label">Bước 1</span>
        <h2 className="scene-selector__title">
          Bạn muốn mặc Việt phục trong <span className="text-gradient">dịp nào?</span>
        </h2>
        <p className="scene-selector__subtitle">
          Chọn bối cảnh để nhận gợi ý trang phục phù hợp nhất
        </p>
      </div>

      {/* Region filter chips */}
      <div className="region-chips animate-fade-in-up stagger-1">
        {REGIONS.map(region => (
          <button
            key={region.id}
            className={`region-chip ${selectedRegion === region.id ? 'region-chip--active' : ''}`}
            onClick={() => onRegionSelect(region.id)}
            id={`region-${region.id}`}
          >
            <span className="region-chip__emoji">{region.emoji}</span>
            {region.name}
          </button>
        ))}
      </div>

      {/* Scene cards grid */}
      <div className="scene-grid">
        {SCENES.map((scene, index) => (
          <button
            key={scene.id}
            className={`scene-card glass-card animate-fade-in-up stagger-${index + 1} ${
              selectedScene === scene.id ? 'scene-card--active' : ''
            }`}
            onClick={() => onSceneSelect(scene.id)}
            id={`scene-${scene.id}`}
          >
            <span className="scene-card__icon">{scene.icon}</span>
            <span className="scene-card__name">{scene.name}</span>
            <span className="scene-card__desc">{scene.desc}</span>
            {selectedScene === scene.id && (
              <span className="scene-card__check">✓</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
