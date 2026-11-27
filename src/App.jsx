import { useEffect, useRef, useState } from "react";

const OUTPUT_SIZE = 256;

function ImageIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m20.5 15-5-5L5 20.5" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m12 2 1.65 7.35L21 11l-7.35 1.65L12 20l-1.65-7.35L3 11l7.35-1.65L12 2Z" />
      <path d="m19 16 .75 2.25L22 19l-2.25.75L19 22l-.75-2.25L16 19l2.25-.75L19 16Z" />
    </svg>
  );
}

function App() {
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    function handlePaste(event) {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      const file = imageItem?.getAsFile();

      if (file) {
        event.preventDefault();
        processImage(file);
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(
    () => () => {
      if (image?.url) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  async function processImage(file) {
    if (!file.type.startsWith("image/")) {
      setError("That file doesn’t look like an image. Try a JPG, PNG, or WebP.");
      return;
    }

    const requestId = ++requestIdRef.current;
    const sourceUrl = URL.createObjectURL(file);
    setError("");
    setIsProcessing(true);

    try {
      const source = new Image();
      source.src = sourceUrl;
      await source.decode();

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Image canvas is not available.");

      context.drawImage(source, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error("Couldn’t create the resized image.")),
          "image/png",
        );
      });

      if (requestId !== requestIdRef.current) return;
      setImage({
        name: file.name || "pasted-image.png",
        url: URL.createObjectURL(blob),
      });
    } catch {
      if (requestId === requestIdRef.current) {
        setError("We couldn’t open that image. Try another file.");
      }
    } finally {
      URL.revokeObjectURL(sourceUrl);
      if (requestId === requestIdRef.current) setIsProcessing(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) processImage(file);
    event.target.value = "";
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a aria-label="Ai Toolz home" className="brand" href="/">
          <span className="brand-mark">
            <SparkleIcon />
          </span>
          <span>Ai Toolz</span>
        </a>
        <span className="topbar-note">
          <span className="status-dot" />
          A little toolkit for everyday
        </span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          YOUR CREATIVE TOOLKIT
        </div>
        <h1 id="page-title">
          Tiny tools.
          <br />
          <span>Big help.</span>
        </h1>
        <p>Simple little things to make your day a bit easier.</p>
      </section>

      <section aria-labelledby="tool-heading" className="tool-card glass-panel">
        <div className="tool-heading">
          <div className="tool-icon">
            <ImageIcon />
          </div>
          <div className="tool-title">
            <div className="tool-kicker">IMAGE TOOL · 01</div>
            <h2 id="tool-heading">Square it</h2>
            <p>Resize any image to a perfect 256 × 256.</p>
          </div>
          <span className="ready-pill">
            <span className="status-dot" />
            READY
          </span>
        </div>

        <div className="tool-workspace">
          <div className="input-column">
            <div className="section-label">
              <span>01</span> ADD AN IMAGE
            </div>
            <button
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) processImage(file);
              }}
              type="button"
            >
              <span className="upload-icon">
                <ImageIcon />
              </span>
              <span className="upload-copy">
                <strong>Drop an image here</strong>
                <span>or click to browse your files</span>
              </span>
              <span className="browse-button">Browse files</span>
            </button>
            <input
              accept="image/*"
              className="visually-hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
              tabIndex="-1"
              type="file"
            />
            <div className="paste-hint">
              <span className="paste-key">Ctrl / ⌘</span>
              <span className="paste-key">V</span>
              <span>Paste an image from your clipboard</span>
            </div>
            <p className="privacy-note">
              <span aria-hidden="true">✦</span> Your image never leaves your
              device.
            </p>
          </div>

          <div aria-hidden="true" className="workspace-divider">
            <span />
          </div>

          <div className="output-column">
            <div className="section-label">
              <span>02</span> YOUR OUTPUT
            </div>
            <div className={`output-preview${image ? " has-image" : ""}`}>
              {image ? (
                <a
                  aria-label={`Download ${image.name} as a 256 by 256 PNG`}
                  className="output-download"
                  download={`${image.name.replace(/\.[^.]+$/, "")}-256x256.png`}
                  href={image.url}
                  title="Click to download your 256 × 256 image"
                >
                  <img alt="Resized 256 by 256 image" src={image.url} />
                  <span className="download-overlay">↓ Save PNG</span>
                </a>
              ) : (
                <div className="empty-output">
                  <span className="output-placeholder-icon">
                    <ImageIcon />
                  </span>
                  <span>Your image will appear here</span>
                </div>
              )}
              {isProcessing && (
                <div className="processing-overlay" role="status">
                  Making it square…
                </div>
              )}
            </div>
            <div className="output-meta">
              <span>PNG</span>
              <span className="meta-separator" />
              <span>256 × 256 PX</span>
              {image && <span className="output-ready">READY TO SAVE</span>}
            </div>
          </div>
        </div>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </section>

      <footer className="page-footer">
        <span>MADE FOR THE LITTLE THINGS</span>
        <span>MORE TOOLS, SOON <span className="footer-sparkle">✳</span></span>
      </footer>
    </main>
  );
}

export default App;
