import { useState, useCallback, useRef } from 'react';
import SceneSelector from './components/SceneSelector';
import OutfitSuggestions from './components/OutfitSuggestions';
import OutfitCustomizer from './components/OutfitCustomizer';
import TurntableViewer from './components/TurntableViewer';
import CultureCard from './components/CultureCard';
import MismatchWarning from './components/MismatchWarning';
import LookbookExport from './components/LookbookExport';
import { filterOutfits, checkMismatch } from './services/cultureData';
import { generateOutfitImage } from './services/geminiImageService';
import './App.css';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Map scene IDs to search terms matching trangphuc.json
const SCENE_MAP = {
  'tet': 'Tết',
  'dam-cuoi': 'đám cưới',
  'ky-yeu': 'kỷ yếu',
  'le-hoi': 'lễ hội',
  'dao-pho': 'dạo phố',
  'chup-anh-di-san': 'chụp ảnh di sản',
};

const REGION_MAP = {
  'all': null,
  'bac': 'Bắc',
  'trung': 'Trung',
  'nam': 'Nam',
};

export default function App() {
  // Flow state
  const [selectedScene, setSelectedScene] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [customizationData, setCustomizationData] = useState(null);
  const [turntableImages, setTurntableImages] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(null);
  const [cultureInfo, setCultureInfo] = useState(null);
  const [mismatchWarnings, setMismatchWarnings] = useState([]);
  const [error, setError] = useState(null);

  // Refs for scrolling
  const outfitRef = useRef(null);
  const uploadRef = useRef(null);
  const resultRef = useRef(null);

  // Get filtered outfits
  const filteredOutfits = selectedScene
    ? filterOutfits({
        scene: SCENE_MAP[selectedScene],
        region: REGION_MAP[selectedRegion],
      })
    : [];

  // Handle scene selection
  const handleSceneSelect = useCallback((sceneId) => {
    setSelectedScene(sceneId);
    setSelectedOutfit(null);
    setTurntableImages(null);
    setError(null);
    // Scroll to outfit section
    setTimeout(() => {
      outfitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // Handle region filter
  const handleRegionSelect = useCallback((regionId) => {
    setSelectedRegion(regionId);
  }, []);

  // Handle outfit selection
  const handleOutfitSelect = useCallback((outfit) => {
    setSelectedOutfit(outfit);
    setTurntableImages(null);
    setError(null);

    // Check mismatch with any previously selected outfit (for demo — check against all others)
    if (selectedOutfit && selectedOutfit.id !== outfit.id) {
      const result = checkMismatch(selectedOutfit.id, outfit.id);
      setMismatchWarnings(result.warnings);
    } else {
      setMismatchWarnings([]);
    }

    // Scroll to upload section
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [selectedOutfit]);

  // Handle customize and generate
  const handleCustomizeAndGenerate = useCallback(async (data) => {
    if (!selectedOutfit) return;

    setCustomizationData(data);
    setIsGenerating(true);
    setError(null);
    setTurntableImages(null);
    setGenerateProgress({ current: 0, total: 4 });

    try {
      setGenerateProgress({ current: 1, total: 4 });
      const frontImage = await generateOutfitImage(
        data.userPhoto,
        selectedOutfit,
        0,
        null,
        data.customizations
      );
      
      setTurntableImages([frontImage]);
      setIsGenerating(false);

      // Background loading for other angles (90, 180, 270)
      const angles = [90, 180, 270];
      for (const angle of angles) {
        try {
          await new Promise(r => setTimeout(r, 10000)); // Delay 10s
          const img = await generateOutfitImage(
            data.userPhoto,
            selectedOutfit,
            angle,
            frontImage,
            data.customizations
          );
          setTurntableImages(prev => {
             if(!prev) return [img];
             return [...prev, img];
          });
        } catch(e) {
          console.warn("Background gen failed for angle", angle);
        }
      }

      // Scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      console.error('Lỗi sinh ảnh:', err);
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setGenerateProgress(null);
    }
  }, [selectedOutfit]);

  // Reset flow
  const handleReset = useCallback(() => {
    setSelectedScene(null);
    setSelectedRegion('all');
    setSelectedOutfit(null);
    setCustomizationData(null);
    setTurntableImages(null);
    setIsGenerating(false);
    setGenerateProgress(null);
    setCultureInfo(null);
    setMismatchWarnings([]);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="app">
      {/* Hero Header */}
      <header className="hero">
        <div className="hero__bg" />
        <div className="container hero__content">
          <p className="hero__badge">
            AI Arena Vietnam 2026
          </p>
          <h1 className="hero__title">
            Việt Phục <span className="text-gradient">Remix</span>
          </h1>
          <p className="hero__desc">
            Khám phá và phối trang phục truyền thống Việt Nam theo phong cách Gen Z.
            Chọn bối cảnh, thử đồ bằng AI, ngắm đa góc nhìn.
          </p>
          <div className="hero__actions">
            <a href="#scene-selector" className="btn btn-primary">
              Bắt đầu phối đồ
            </a>
            {DEMO_MODE && (
              <span className="hero__demo-badge">Demo Mode</span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container main-content">
        {/* Step 1: Scene Selection */}
        <SceneSelector
          onSceneSelect={handleSceneSelect}
          onRegionSelect={handleRegionSelect}
          selectedScene={selectedScene}
          selectedRegion={selectedRegion}
        />

        {/* Step 2: Outfit Suggestions */}
        <div ref={outfitRef}>
          <OutfitSuggestions
            outfits={filteredOutfits}
            onSelect={handleOutfitSelect}
            selectedId={selectedOutfit?.id}
          />
        </div>

        {/* Mismatch Warning */}
        <MismatchWarning
          warnings={mismatchWarnings}
          onDismiss={() => setMismatchWarnings([])}
        />

        {/* Step 3: Photo Upload */}
        {selectedOutfit && (
          <div ref={uploadRef}>
            <OutfitCustomizer
              selectedOutfit={selectedOutfit}
              onCustomizeAndGenerate={handleCustomizeAndGenerate}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-banner animate-fade-in" id="error-banner">
            <span className="error-banner__icon">❌</span>
            <div className="error-banner__content">
              <strong>Đã xảy ra lỗi</strong>
              <p>{error}</p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Results Section — Asymmetric Split */}
        <div ref={resultRef}>
          {(isGenerating || turntableImages) && (
            <div className="result-split-layout">
              <div className="result-viewer">
                <TurntableViewer
                  images={turntableImages}
                  isLoading={isGenerating}
                  progress={generateProgress}
                />
              </div>

              <div className="result-sidebar">
                {turntableImages && selectedOutfit && (
                  <>
                    <CultureCard
                      outfit={selectedOutfit}
                      useDemoData={DEMO_MODE}
                      customizations={customizationData?.customizations}
                    />
                    <LookbookExport
                      outfit={selectedOutfit}
                      imageBase64={turntableImages[0]}
                      cultureInfo={cultureInfo}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reset button */}
        {turntableImages && (
          <div className="reset-section animate-fade-in-up">
            <button
              className="btn btn-secondary btn-lg"
              onClick={handleReset}
              id="reset-btn"
            >
              🔄 Phối bộ khác
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer__content">
          <div className="footer__brand">
            <span className="footer__logo">🇻🇳</span>
            <span className="footer__name">Việt Phục Remix</span>
          </div>
          <p className="footer__tagline">
            Tôn vinh vẻ đẹp trang phục truyền thống Việt Nam
          </p>
          <div className="footer__meta">
            <span>Powered by Gemini AI</span>
            <span>•</span>
            <span>AI Arena Vietnam 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
