import { useState, useRef, useCallback, useEffect } from 'react';
import './TurntableViewer.css';

const ANGLES = [
  { label: 'Trước', angle: 0 },
  { label: 'Phải', angle: 90 },
  { label: 'Sau', angle: 180 },
  { label: 'Trái', angle: 270 }
];

export default function TurntableViewer({ images, isLoading, progress, activeModel, currentModelStatus }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [preloaded, setPreloaded] = useState({});

  const containerRef = useRef(null);
  const dragStartX = useRef(0);
  const dragStartIndex = useRef(0);
  const rafId = useRef(null);
  const pendingIndex = useRef(0);
  const tiltRef = useRef({ x: 0, y: 0 });
  const wrapperRef = useRef(null);

  // Reset on new image set
  useEffect(() => {
    if (!images || images.length === 0) {
      setActiveIndex(0);
      setPreloaded({});
    }
  }, [images]);

  // Preload images into browser cache
  useEffect(() => {
    if (!images) return;
    images.forEach((src, i) => {
      if (preloaded[i]) return;
      const img = new Image();
      img.onload = () => setPreloaded(prev => ({ ...prev, [i]: true }));
      img.src = src.startsWith('http') ? src : `data:image/png;base64,${src}`;
    });
  }, [images]);

  // Apply tilt via rAF (no re-renders)
  const applyTilt = useCallback(() => {
    if (wrapperRef.current) {
      const { x, y } = tiltRef.current;
      wrapperRef.current.style.transform =
        `perspective(800px) rotateX(${x}deg) rotateY(${y}deg)`;
    }
    rafId.current = null;
  }, []);

  const scheduleTilt = useCallback(() => {
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(applyTilt);
    }
  }, [applyTilt]);

  // Parallax on hover (only when not dragging)
  const handleMouseMove = useCallback((e) => {
    if (isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    tiltRef.current = { x: -yPct * 20, y: xPct * 20 };
    scheduleTilt();
  }, [isDragging, scheduleTilt]);

  const resetTilt = useCallback(() => {
    tiltRef.current = { x: 0, y: 0 };
    scheduleTilt();
  }, [scheduleTilt]);

  // Drag to spin
  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragStartIndex.current = activeIndex;
    pendingIndex.current = activeIndex;
    resetTilt();
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !images || images.length <= 1) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const diff = clientX - dragStartX.current;
    const sensitivity = 60;
    const steps = Math.floor(Math.abs(diff) / sensitivity);

    if (steps > 0) {
      const dir = diff > 0 ? -1 : 1;
      let newIdx = (dragStartIndex.current + steps * dir) % images.length;
      if (newIdx < 0) newIdx += images.length;

      if (newIdx !== pendingIndex.current) {
        pendingIndex.current = newIdx;
        setActiveIndex(newIdx);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="turntable" id="turntable-viewer">
        <div className="turntable__header">
          <h2 className="turntable__title">
            Đang <span className="text-gradient">thử đồ</span> cho bạn…
          </h2>
        </div>
        <div className="turntable__skeleton-frame">
          <div className="skeleton-shimmer" />
          <div className="turntable__skeleton-info">
            <span className="spinner" />
            <div className="turntable__skeleton-details">
              <span className="turntable__skeleton-progress">
                {progress ? `${Math.round((progress.current / progress.total) * 100)}%` : 'Đang xử lý…'}
              </span>
              {currentModelStatus && (
                <span className="turntable__skeleton-model animate-fade-in">
                  Đang chạy: <strong>{currentModelStatus}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!images || images.length === 0) return null;

  const activeImg = images[activeIndex];
  const imgSrc = activeImg && (activeImg.startsWith('http') ? activeImg : `data:image/png;base64,${activeImg}`);

  return (
    <section className="turntable" id="turntable-viewer">
      <div className="turntable__header">
        <div className="turntable__header-row">
          <h2 className="turntable__title">
            <span className="text-gradient">Kéo ngang</span> để xoay nhân vật
          </h2>
          {activeModel && (
            <div className="turntable__model-badge animate-fade-in" id="active-model-badge" title="Mô hình AI được sử dụng">
              <span className="turntable__model-dot" />
              <span className="turntable__model-label">Mô hình AI:</span>
              <span className="turntable__model-name">{activeModel}</span>
            </div>
          )}
        </div>
      </div>

      <div
        className={`turntable__frame ${isDragging ? 'is-dragging' : ''}`}
        ref={containerRef}
        onMouseDown={handlePointerDown}
        onMouseMove={(e) => { handlePointerMove(e); handleMouseMove(e); }}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => { handlePointerUp(); resetTilt(); }}
        onTouchStart={(e) => handlePointerDown(e.touches[0])}
        onTouchMove={(e) => handlePointerMove(e.touches[0])}
        onTouchEnd={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="turntable__image-wrapper" ref={wrapperRef}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={`Góc nhìn ${ANGLES[activeIndex]?.label}`}
              className="turntable__image"
              draggable={false}
            />
          ) : (
            <div className="turntable__placeholder">
              <span className="spinner" /> Đang tải…
            </div>
          )}
        </div>

        {/* Navigation dots */}
        <nav className="turntable__dots">
          {ANGLES.map((a, i) => {
            const available = i < images.length;
            return (
              <button
                key={i}
                className={`turntable__dot ${i === activeIndex ? 'active' : ''} ${!available ? 'pending' : ''}`}
                onClick={(e) => { e.stopPropagation(); if (available) setActiveIndex(i); }}
                disabled={!available}
                aria-label={a.label}
              >
                {a.label}
              </button>
            );
          })}
        </nav>

        {images.length < 4 && (
          <p className="turntable__status">Đang tạo ngầm các góc còn lại…</p>
        )}
      </div>
    </section>
  );
}
