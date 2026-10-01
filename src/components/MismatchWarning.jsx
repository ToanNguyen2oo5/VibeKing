import { useState } from 'react';
import './MismatchWarning.css';

export default function MismatchWarning({ warnings, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (!warnings || warnings.length === 0 || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="mismatch-warning animate-fade-in-up" id="mismatch-warning" role="alert">
      <div className="mismatch-warning__icon">⚠️</div>
      <div className="mismatch-warning__content">
        <h4 className="mismatch-warning__title">Gợi ý phối đồ</h4>
        {warnings.map((warning, i) => (
          <div key={i} className="mismatch-warning__item">
            <p className="mismatch-warning__text">
              <strong>{warning.from}</strong> + <strong>{warning.to}</strong>
            </p>
            <p className="mismatch-warning__reason">{warning.ly_do}</p>
          </div>
        ))}
        <p className="mismatch-warning__note">
          Đây chỉ là gợi ý — bạn hoàn toàn có thể giữ lựa chọn của mình!
        </p>
      </div>
      <button
        className="mismatch-warning__close"
        onClick={handleDismiss}
        title="Vẫn giữ lựa chọn này"
      >
        ✕
      </button>
    </div>
  );
}
