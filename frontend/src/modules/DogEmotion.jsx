import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './DogEmotion.module.css'
import { API_BASE_URL } from '../config'

const MODE_TABS = [
  { id: 'image', label: '🖼️ Image', accept: 'image/jpeg,image/png,image/webp' },
  { id: 'video', label: '🎥 Video', accept: 'video/mp4,video/x-msvideo,video/quicktime,video/webm' },
  { id: 'webcam', label: '📷 Webcam' },
]

const EMOTION_COLORS = {
  happy:  { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' },
  relax:  { bg: '#eff6ff', border: '#93c5fd', text: '#2563eb' },
  alert:  { bg: '#fffbeb', border: '#fcd34d', text: '#d97706' },
  frown:  { bg: '#fdf4ff', border: '#d8b4fe', text: '#9333ea' },
  angry:  { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
}

export default function DogEmotion() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const fileRef  = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const discardRecordingRef = useRef(false)

  const [mode, setMode]       = useState('image')
  const [preview, setPreview] = useState(null)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  useEffect(() => {
    if (!recording) return undefined
    const timerId = window.setInterval(() => setRecordingSeconds(seconds => seconds + 1), 1000)
    return () => window.clearInterval(timerId)
  }, [recording])

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') {
      discardRecordingRef.current = true
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(track => track.stop())
  }, [])

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
  }, [preview])

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  async function startCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not available in this browser or page context.')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
    } catch (err) {
      const reason = err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in the browser settings and try again.'
        : err.name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : `Could not access the camera: ${err.message}`
      setResult({ error: reason })
    }
  }

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []
    if (typeof MediaRecorder === 'undefined') {
      setResult({ error: 'This browser does not support webcam recording. Try a current version of Chrome, Edge, or Firefox.' })
      return
    }
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find(type => MediaRecorder.isTypeSupported(type))
    let recorder
    try {
      recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    } catch (err) {
      setResult({ error: `Could not start recording: ${err.message}` })
      return
    }
    discardRecordingRef.current = false
    recorderRef.current = recorder
    recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data) }
    recorder.onerror = event => {
      discardRecordingRef.current = true
      setRecording(false)
      setResult({ error: `Recording failed: ${event.error?.message || 'the browser reported a media error.'}` })
      stopCamera()
    }
    recorder.onstop = () => {
      if (discardRecordingRef.current) {
        discardRecordingRef.current = false
        stopCamera()
        return
      }
      const mimeType = recorder.mimeType || 'video/webm'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      if (!blob.size) {
        setResult({ error: 'The recording is empty. Record a little longer and try again.' })
        setRecording(false)
        stopCamera()
        return
      }
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([blob], `aware-webcam-${Date.now()}.${extension}`, { type: blob.type })
      fileRef.current = file
      setPreview(URL.createObjectURL(blob))
      stopCamera()
    }
    try {
      recorder.start()
      setRecordingSeconds(0)
      setRecording(true)
      setResult(null)
    } catch (err) {
      setResult({ error: `Could not start recording: ${err.message}` })
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    setRecording(false)
  }

  function handleFile(file) {
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const extension = file.name.split('.').pop()?.toLowerCase()
    const validImageExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
    const validVideoExtension = ['mp4', 'avi', 'mov', 'webm'].includes(extension)
    if ((mode === 'image' && (!isImage || !validImageExtension)) || (mode === 'video' && (!isVideo || !validVideoExtension))) {
      setResult({ error: mode === 'image'
        ? 'Choose a JPG, PNG, or WEBP image.'
        : 'Choose an MP4, AVI, MOV, or WebM video.' })
      return
    }
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setResult(null)
    fileRef.current = file
    setPreview(mode === 'image' ? URL.createObjectURL(file) : URL.createObjectURL(file))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function clearFile() {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(null)
    setResult(null)
    fileRef.current = null
    if (inputRef.current) inputRef.current.value = ''
  }

  function switchMode(m) {
    stopCamera()
    if (recorderRef.current?.state === 'recording') {
      discardRecordingRef.current = true
      recorderRef.current.stop()
    }
    setMode(m)
    clearFile()
  }

  async function handleAnalyze() {
    if (!fileRef.current) return
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', fileRef.current)
      const endpoint = mode === 'image'
        ? `${API_BASE_URL}/predict`
        : `${API_BASE_URL}/predict-video`
      const res  = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error || data.detail) throw new Error(data.detail || data.error || `Request failed (${res.status})`)
      setResult({
        ...data,
        emotion:    data.emotion,
        confidence: (data.confidence * 100).toFixed(1),
        emoji:      data.emoji,
        cues:       data.cues,
        body:       data.body,
        advice:     data.advice,
        evolution:  data.evolution   // 🔥 ADD THIS
      })
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const emotionKey   = result?.emotion?.toLowerCase()
  const emotionColor = EMOTION_COLORS[emotionKey] ?? EMOTION_COLORS.relax

  return (
    <div className={styles.page}>

      {/* ── Back ── */}
      <button className={styles.back} onClick={() => navigate('/modules')}>
        ← Back to Modules
      </button>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>🐶</div>
        <div>
          <h1 className={styles.title}>Dog Emotion Analysis</h1>
          <p className={styles.subtitle}>
            Experimental dog behaviour and expression analysis. Predictions are model-generated estimates, not verified statements of an animal's emotional state.
          </p>
        </div>
      </div>

      {/* ── Mode tabs ── */}
      <div className={styles.tabs}>
        {MODE_TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${mode === t.id ? styles.tabActive : ''}`}
            onClick={() => switchMode(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main layout ── */}
      <div className={styles.layout}>

        {/* Upload panel */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>
            {mode === 'webcam' ? 'Webcam Recording' : `Upload ${mode === 'image' ? 'Image' : 'Video'}`}
          </p>

          <div
            className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''} ${preview ? styles.hasFile : ''}`}
            onClick={() => mode !== 'webcam' && !preview && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
          >
            {preview ? (
              mode === 'image'
                ? <img src={preview} alt="Preview" className={styles.preview} />
                : (
                  <div className={styles.videoPreview}>
                    <video src={preview} controls className={styles.preview} />
                    <span className={styles.videoReady}>Ready to analyze</span>
                  </div>
                )
            ) : mode === 'webcam' ? (
              <div className={styles.videoPreview}>
                <video ref={videoRef} autoPlay muted playsInline className={styles.preview} />
                {!cameraOn && <span className={styles.videoReady}>Start camera to preview</span>}
              </div>
            ) : (
              <div className={styles.dropzoneInner}>
                <span className={styles.dropzoneIcon}>
                  {mode === 'image' ? '🖼️' : '🎥'}
                </span>
                <p className={styles.dropzoneText}>Drag & drop or click to upload</p>
                  <p className={styles.dropzoneHint}>
                  {mode === 'image' ? 'PNG, JPG, WEBP' : 'MP4, MOV, AVI, WEBM'}
                </p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={MODE_TABS.find(t => t.id === mode).accept}
            className={styles.fileInput}
            onChange={e => handleFile(e.target.files[0])}
          />

          <div className={styles.actions}>
            {mode === 'webcam' && !cameraOn && !preview && <button className={styles.btnSecondary} onClick={startCamera}>Start camera</button>}
            {mode === 'webcam' && cameraOn && !recording && <button className={styles.btnSecondary} onClick={startRecording}>Start recording</button>}
            {mode === 'webcam' && recording && <button className={styles.btnSecondary} onClick={stopRecording}>Stop recording</button>}
            {mode === 'webcam' && cameraOn && <span className={styles.infoBlockText} role="status">{recording ? `Recording · ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}` : 'Camera ready'}</span>}
            {mode === 'webcam' && preview && <button className={styles.btnSecondary} onClick={clearFile}>Retake</button>}
            {preview && (
              <button className={styles.btnSecondary} onClick={clearFile}>
                Clear
              </button>
            )}
            <button
              className={styles.btnPrimary}
              onClick={handleAnalyze}
              disabled={!preview || loading || recording}
            >
              {loading
                ? <><span className={styles.spinnerInline} /> Analyzing…</>
                : '✨ Analyze Emotion'
              }
            </button>
          </div>
        </div>

        {/* Result panel */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Result</p>

          {/* Empty state */}
          {!result && !loading && (
            <div className={styles.emptyState}>
              <span className={styles.emptyDog}>🐶</span>
              <p className={styles.emptyText}>Your analysis will appear here</p>
              <p className={styles.emptyHint}>Upload a file and click Analyze</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p className={styles.emptyText}>Running model inference…</p>
              <p className={styles.emptyHint}>This may take a few seconds</p>
            </div>
          )}

          {/* Error */}
          {result?.error && (
            <div className={styles.errorBox}>
              <span>⚠️</span>
              <div>
                <p className={styles.errorTitle}>Something went wrong</p>
                <p className={styles.errorMsg}>{result.error}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {result && !result.error && (
            <div className={styles.resultWrap}>

              {/* Emotion hero */}
              {result.label_mapping_verified === false && (
                <div className={styles.verificationWarning} role="status">
                  Baseline output: class mapping and training preprocessing have not been verified. Treat this label and score as unverified model output, not a validated affect assessment.
                </div>
              )}
              <div
                className={styles.emotionHero}
                style={{
                  background: emotionColor.bg,
                  borderColor: emotionColor.border,
                }}
              >
                <span className={styles.emotionEmoji}>{result.emoji}</span>
                <div>
                  <p
                    className={styles.emotionLabel}
                    style={{ color: emotionColor.text }}
                  >
                    {result.emotion.toUpperCase()}
                  </p>
                  <p className={styles.emotionSub}>Predicted affective indicator</p>
                </div>
                <div className={styles.confidencePill} style={{ background: emotionColor.border }}>
                  <span style={{ color: emotionColor.text }}>{result.confidence}%</span>
                </div>
              </div>

              {/* Confidence bar */}
              <div className={styles.confBarWrap}>
                <div className={styles.confBarLabel}>
                  <span>Confidence</span>
                  <span>{result.confidence}%</span>
                </div>
                <div className={styles.confBarTrack}>
                  <div
                    className={styles.confBarFill}
                    style={{
                      width: `${result.confidence}%`,
                      background: emotionColor.text,
                    }}
                  />
                </div>
              </div>

              {/* Visual cues */}
              <div className={styles.infoBlock}>
                <div className={styles.infoBlockHeader}>
                  <span className={styles.infoBlockIcon}>👁️</span>
                  <span className={styles.infoBlockTitle}>Visual Cues</span>
                </div>
                <ul className={styles.cueList}>
                  {result.cues.map((cue, i) => (
                    <li key={i} className={styles.cueItem}>
                      <span className={styles.cueDot} style={{ background: emotionColor.text }} />
                      {cue}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Behavior */}
              <div className={styles.infoBlock}>
                <div className={styles.infoBlockHeader}>
                  <span className={styles.infoBlockIcon}>🧠</span>
                  <span className={styles.infoBlockTitle}>Behavior</span>
                </div>
                <p className={styles.infoBlockText}>{result.body}</p>
              </div>

              {/* Advice */}
              <div className={styles.adviceBlock}>
              {/* 🔥 Behavior Evolution */}
              {result.evolution && (
              <div className={styles.infoBlock}>
              <div className={styles.infoBlockHeader}>
              <span className={styles.infoBlockIcon}>📊</span>
              <span className={styles.infoBlockTitle}>Behavior Evolution</span>
              </div>
              <p className={styles.infoBlockText}>{result.evolution}</p>
              </div>
             )} 
                <div className={styles.infoBlockHeader}>
                  <span className={styles.infoBlockIcon}>💡</span>
                  <span className={styles.infoBlockTitle}>Recommendation</span>
                </div>
                <p className={styles.infoBlockText}>{result.advice}</p>
              </div>

              {result.emotion_distribution && (
                <div className={styles.infoBlock}>
                  <div className={styles.infoBlockHeader}><span className={styles.infoBlockIcon}>📈</span><span className={styles.infoBlockTitle}>Frame-level distribution</span></div>
                  {Object.entries(result.emotion_distribution).map(([label, value]) => (
                    <div key={label} className={styles.distributionRow}>
                      <span>{label}</span><div className={styles.confBarTrack}><div className={styles.confBarFill} style={{ width: `${value * 100}%`, background: EMOTION_COLORS[label]?.text || 'var(--primary)' }} /></div><span>{(value * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                  <p className={styles.infoBlockText}>{result.sample_count} sampled frames · {result.duration_seconds}s video · {result.processing_seconds}s processing · consistency {(result.prediction_consistency * 100).toFixed(0)}% · uncertainty {(result.uncertainty_normalized_entropy * 100).toFixed(0)}%</p>
                  <div className={styles.timeline}>
                    {result.timestamped_predictions?.map((item, index) => <div key={`${item.timestamp_seconds}-${index}`} className={styles.timelineItem}><strong>{item.timestamp_seconds.toFixed(1)}s</strong> {item.emotion} · {(item.confidence * 100).toFixed(0)}%</div>)}
                  </div>
                  <div className={styles.representativeFrames}>
                    {result.representative_frames?.map((frame, index) => <figure key={index}><img src={`data:image/jpeg;base64,${frame.image_jpeg_base64}`} alt={`${frame.emotion} at ${frame.timestamp_seconds}s`} /><figcaption>{frame.timestamp_seconds}s · {frame.emotion}</figcaption></figure>)}
                  </div>
                </div>
              )}
              <p className={styles.limitation}>{result.limitations || 'Predicted visual categories are uncertain indicators, not proof of a dog’s internal emotional state.'}{result.duration_seconds ? ' Frame-level predictions are aggregated over time; no temporal neural network is used.' : ''}</p>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
