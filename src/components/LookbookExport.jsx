import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import './LookbookExport.css';

export default function LookbookExport({ outfit, imageBase64, cultureInfo, modelName }) {
  const cardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [shareSupported] = useState(() => !!navigator.share);

  if (!outfit || !imageBase64) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a12',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `viet-phuc-remix-${outfit.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Lỗi xuất lookbook:', err);
      alert('Không thể xuất ảnh. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a12',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `viet-phuc-remix-${outfit.id}.png`, {
          type: 'image/png'
        });

        try {
          await navigator.share({
            title: `Việt Phục Remix — ${outfit.ten}`,
            text: `Xem phối đồ Việt phục: ${outfit.ten} 🇻🇳`,
            files: [file],
          });
        } catch (shareErr) {
          // User cancelled or not supported
          if (shareErr.name !== 'AbortError') {
            console.error('Share failed:', shareErr);
          }
        }
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error('Lỗi chia sẻ:', err);
      setIsExporting(false);
    }
  };

  return (
    <section className="lookbook-export" id="lookbook-export">
      <div className="lookbook-export__header animate-fade-in-up">
        <span className="lookbook-export__label">Lookbook</span>
        <h2 className="lookbook-export__title">
          <span className="text-gradient">Lưu & chia sẻ</span> phong cách của bạn
        </h2>
      </div>

      {/* Lookbook card (will be captured as image) */}
      <div className="lookbook-card-wrapper animate-fade-in-up">
        <div className="lookbook-card" ref={cardRef}>
          {/* Card background */}
          <div className="lookbook-card__bg" />

          {/* Image */}
          <div className="lookbook-card__image">
            <img
              src={imageBase64.startsWith('http') ? imageBase64 : `data:image/png;base64,${imageBase64}`}
              alt={outfit.ten}
              crossOrigin="anonymous"
            />
          </div>

          {/* Info */}
          <div className="lookbook-card__info">
            <div className="lookbook-card__brand">
              <span className="lookbook-card__logo">🇻🇳</span>
              <span className="lookbook-card__brand-text">Việt Phục Remix</span>
            </div>
            <h3 className="lookbook-card__name">{outfit.ten}</h3>
            <p className="lookbook-card__region">{outfit.vung_mien}</p>
            <div className="lookbook-card__colors">
              {outfit.mau_dac_trung.slice(0, 3).map((color, i) => (
                <span key={i} className="lookbook-card__color">{color}</span>
              ))}
            </div>
            {cultureInfo?.y_nghia_dien_giai && (
              <p className="lookbook-card__desc">
                {cultureInfo.y_nghia_dien_giai.slice(0, 120)}...
              </p>
            )}
            {modelName && (
              <div className="lookbook-card__ai-model">
                ⚡ AI: {modelName}
              </div>
            )}
          </div>

          {/* Watermark */}
          <div className="lookbook-card__watermark">
            vietphucremix.app
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="lookbook-export__actions animate-fade-in-up">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleDownload}
          disabled={isExporting}
          id="download-lookbook"
        >
          {isExporting ? (
            <>
              <span className="spinner" />
              Đang xuất...
            </>
          ) : (
            <>
              📥 Tải lookbook
            </>
          )}
        </button>
        {shareSupported && (
          <button
            className="btn btn-secondary btn-lg"
            onClick={handleShare}
            disabled={isExporting}
            id="share-lookbook"
          >
            📤 Chia sẻ
          </button>
        )}
      </div>
    </section>
  );
}
