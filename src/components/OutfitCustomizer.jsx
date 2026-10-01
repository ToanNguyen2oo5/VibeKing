import { useState, useRef, useEffect } from 'react';
import { fileToBase64 } from '../services/geminiImageService';
import './OutfitCustomizer.css';

const SAMPLE_AVATARS = [
  { id: 'female_1', label: 'Nữ mẫu 1', emoji: '👩' },
  { id: 'male_1', label: 'Nam mẫu 1', emoji: '👨' },
  { id: 'female_2', label: 'Nữ mẫu 2', emoji: '👩‍🦱' },
];

export default function OutfitCustomizer({ onCustomizeAndGenerate, selectedOutfit, isGenerating }) {
  // Upload states
  const [preview, setPreview] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Customization states
  const [fit, setFit] = useState('Vừa vặn');
  const [length, setLength] = useState('Trung (giữa bắp chân)');
  const [collar, setCollar] = useState('Truyền thống');
  const [sleeve, setSleeve] = useState('Dài tay');
  const [height, setHeight] = useState('');
  const [heightTip, setHeightTip] = useState('');

  // Handle Height changes and give tips
  useEffect(() => {
    if (!height || isNaN(height)) {
      setHeightTip('');
      return;
    }
    const h = parseInt(height, 10);
    if (h < 155) {
      setHeightTip('✨ Tip: Muốn tôn dáng cao ráo hơn? Thử chọn tà ngắn hoặc trung kết hợp họa tiết dọc nhé!');
    } else if (h > 170) {
      setHeightTip('✨ Tip: Bạn có lợi thế chiều cao! Thử tà dài chấm gót để tạo vẻ thướt tha, bồng bềnh.');
    } else {
      setHeightTip('✨ Tip: Chiều cao cân đối, bạn có thể tự do thử nghiệm mọi độ dài tà áo!');
    }
  }, [height]);

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (jpg, png, webp)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.');
      return;
    }

    const base64 = await fileToBase64(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setUserPhoto(base64);
    setSelectedAvatar(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar.id);
    setPreview(null);
    setUserPhoto(null);
  };

  const handleGenerateClick = () => {
    onCustomizeAndGenerate({
      userPhoto,
      customizations: { fit, length, collar, sleeve, height }
    });
  };

  const hasSelection = preview || selectedAvatar;

  return (
    <section className="outfit-customizer" id="outfit-customizer">
      <div className="outfit-customizer__header animate-fade-in-up">
        <span className="outfit-customizer__label">Bước 3</span>
        <h2 className="outfit-customizer__title">
          Tùy chỉnh & <span className="text-gradient">Lên đồ</span>
        </h2>
        <p className="outfit-customizer__subtitle">
          Cá nhân hóa phom dáng và chọn người mẫu để thử đồ
        </p>

        {/* Thời tiết & Bối cảnh (Mockup tính năng WOW) */}
        <div className="weather-tip">
          <span className="weather-tip__icon">🌤️</span>
          <p><strong>Hà Nội - 22°C (Mùa Thu):</strong> AI gợi ý bạn nên chọn phom dáng "Vừa vặn" và "Dài tay" để dạo phố lãng mạn mà vẫn giữ ấm nhé!</p>
        </div>
      </div>

      <div className="customizer-layout">
        {/* Cột 1: Tùy chỉnh Phom dáng */}
        <div className="customizer-panel glass-panel animate-fade-in-up stagger-1">
          <h3 className="panel-title">✂️ Cá nhân hóa Phom dáng</h3>
          
          <div className="form-group">
            <label>Chiều cao của bạn (cm) <span className="optional">(không bắt buộc)</span></label>
            <input 
              type="number" 
              placeholder="Ví dụ: 160" 
              value={height} 
              onChange={(e) => setHeight(e.target.value)}
              className="custom-input"
            />
            {heightTip && <p className="height-tip animate-fade-in">{heightTip}</p>}
          </div>

          <div className="form-group">
            <label>Độ ôm</label>
            <div className="segmented-control">
              {['Ôm sát', 'Vừa vặn', 'Rộng rãi'].map(opt => (
                <button 
                  key={opt}
                  className={`seg-btn ${fit === opt ? 'seg-btn--active' : ''}`}
                  onClick={() => setFit(opt)}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Độ dài tà áo</label>
            <div className="segmented-control">
              {['Ngắn (qua gối)', 'Trung (giữa bắp chân)', 'Dài (chấm gót)'].map(opt => (
                <button 
                  key={opt}
                  className={`seg-btn ${length === opt ? 'seg-btn--active' : ''}`}
                  onClick={() => setLength(opt)}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kiểu cổ áo</label>
              <select value={collar} onChange={e => setCollar(e.target.value)} className="custom-select">
                <option>Truyền thống</option>
                <option>Cổ thuyền</option>
                <option>Cổ trụ cách tân</option>
              </select>
            </div>
            <div className="form-group">
              <label>Kiểu tay áo</label>
              <select value={sleeve} onChange={e => setSleeve(e.target.value)} className="custom-select">
                <option>Dài tay</option>
                <option>Tay lỡ</option>
                <option>Tay ngắn cách tân</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cột 2: Upload Ảnh */}
        <div className="photo-panel animate-fade-in-up stagger-2">
          <h3 className="panel-title">📸 Chọn ảnh chân dung</h3>
          <div
            className={`upload-zone glass-panel ${dragOver ? 'upload-zone--drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="upload-zone__preview">
                <img src={preview} alt="Preview" />
                <button
                  className="upload-zone__change"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    setUserPhoto(null);
                  }}
                >
                  Đổi ảnh khác
                </button>
              </div>
            ) : (
              <>
                <div className="upload-zone__icon">📷</div>
                <p className="upload-zone__text">
                  Kéo thả ảnh hoặc <span className="upload-zone__link">chọn từ máy</span>
                </p>
                <p className="upload-zone__hint">JPG, PNG, WebP • Tối đa 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              hidden
            />
          </div>

          <div className="photo-upload__divider"><span>hoặc</span></div>

          <div className="avatar-grid">
            <p className="avatar-grid__label">Chọn nhân vật mẫu</p>
            <div className="avatar-grid__items">
              {SAMPLE_AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  className={`avatar-item glass-card ${selectedAvatar === avatar.id ? 'avatar-item--active' : ''}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <span className="avatar-item__emoji">{avatar.emoji}</span>
                  <span className="avatar-item__label">{avatar.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasSelection && selectedOutfit && (
        <div className="photo-upload__action animate-fade-in-up">
          <button
            className="btn btn-primary btn-lg generate-btn"
            onClick={handleGenerateClick}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><span className="spinner" />Đang tạo trang phục...</>
            ) : (
              <>✨ Tạo trang phục cho tôi</>
            )}
          </button>
          <p className="generate-hint">
            AI sẽ tạo hình ảnh bạn mặc <strong>{selectedOutfit.ten}</strong> với phom dáng <strong>{fit}, {length}</strong>
          </p>
        </div>
      )}
    </section>
  );
}
