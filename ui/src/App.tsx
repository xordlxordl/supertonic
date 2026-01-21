import { useState, useRef, useEffect } from 'react'
// import { FolderArrowDownIcon, SpeakerWaveIcon, CommandLineIcon } from '@heroicons/react/24/solid'

// Define types for Electron API
declare global {
    interface Window {
        electronAPI: {
            generateTTS: (params: { text: string; voice: string; lang: string; speed: number; steps: number }) => Promise<{ filePath: string; stdout: string }>,
            saveAudio: (filePath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
        }
    }
}

function App() {
    const [text, setText] = useState("오늘 아침 일찍 산책을 다녀왔더니, 기분이 상쾌하고 좋았다.")
    const [voice, setVoice] = useState("M1")
    const [lang, setLang] = useState("ko")
    const [speed, setSpeed] = useState(1.0)
    const [steps, setSteps] = useState(5) // Default 5 steps
    const [loading, setLoading] = useState(false)
    const [audioSrc, setAudioSrc] = useState<string | null>(null)
    const [rawFilePath, setRawFilePath] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    const voices = [
        { id: 'M1', label: 'Male 1' },
        { id: 'M2', label: 'Male 2' },
        { id: 'M3', label: 'Male 3' },
        { id: 'M4', label: 'Male 4' },
        { id: 'M5', label: 'Male 5' },
        { id: 'F1', label: 'Female 1' },
        { id: 'F2', label: 'Female 2' },
        { id: 'F3', label: 'Female 3' },
        { id: 'F4', label: 'Female 4' },
        { id: 'F5', label: 'Female 5' },
    ]

    const languages = [
        { id: 'en', label: 'English' },
        { id: 'ko', label: 'Korean' },
        { id: 'es', label: 'Spanish' },
        { id: 'pt', label: 'Portuguese' },
        { id: 'fr', label: 'French' },
    ]

    const handleGenerate = async () => {
        if (!text.trim()) return
        setLoading(true)
        setError(null)
        setAudioSrc(null)
        setRawFilePath(null)

        try {
            const result = await window.electronAPI.generateTTS({ text, voice, lang, speed, steps })
            console.log("Generated:", result)
            const fileUrl = "file:///" + result.filePath.replace(/\\/g, '/')
            setAudioSrc(fileUrl)
            setRawFilePath(result.filePath)
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to generate audio")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!rawFilePath) return;
        const result = await window.electronAPI.saveAudio(rawFilePath);
        if (result.success) {
            alert(`File saved to ${result.filePath}`);
        } else if (result.error) {
            alert(`Error saving file: ${result.error}`);
        }
    }

    // Auto-play when audio source changes
    useEffect(() => {
        if (audioSrc && audioRef.current) {
            audioRef.current.play()
        }
    }, [audioSrc])

    return (
        <div className="min-h-screen bg-sonic-black text-sonic-text p-8 font-sans selection:bg-sonic-accent selection:text-black">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex justify-between items-center border-b border-sonic-gray pb-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter text-white">
                            Supertonic
                        </h1>
                        <p className="text-gray-400 mt-2">Lightning Fast On-Device TTS</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-xs text-right text-gray-500">
                            <p>Status: Local</p>
                        </div>
                    </div>
                </header>

                {/* Main Interface */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Controls - Left Panel */}
                    <div className="md:col-span-4 space-y-6">

                        {/* Language Selection */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Language</label>
                            <div className="grid grid-cols-2 gap-2">
                                {languages.map((l) => (
                                    <button
                                        key={l.id}
                                        onClick={() => setLang(l.id)}
                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border ${lang === l.id
                                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                            : 'bg-sonic-gray border-transparent hover:border-gray-600 text-gray-300'
                                            }`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Voice Selection */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Voice Model</label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {voices.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setVoice(v.id)}
                                        className={`px-3 py-2 rounded-lg text-sm text-center transition-all duration-200 border ${voice === v.id
                                            ? 'bg-sonic-accent text-black border-sonic-accent font-bold shadow-[0_0_15px_rgba(0,255,163,0.3)]'
                                            : 'bg-sonic-gray border-transparent hover:bg-gray-800 text-gray-400'
                                            }`}
                                    >
                                        {v.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Speed Control */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Speed</label>
                                <span className="text-xs font-mono text-sonic-accent">{speed.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-2 bg-sonic-gray rounded-lg appearance-none cursor-pointer accent-sonic-accent"
                            />
                        </div>

                        {/* Quality (Steps) Control */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Quality (Steps)</label>
                                <span className="text-xs font-mono text-sonic-accent">{steps}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Fast</span>
                                <span>High Quality</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={steps}
                                onChange={(e) => setSteps(parseInt(e.target.value))}
                                className="w-full h-2 bg-sonic-gray rounded-lg appearance-none cursor-pointer accent-sonic-accent"
                            />
                        </div>

                    </div>

                    {/* Input & Output - Right Panel */}
                    <div className="md:col-span-8 space-y-6 flex flex-col">

                        {/* Text Input */}
                        <div className="flex-grow space-y-2">
                            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Input Text</label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="w-full h-64 bg-sonic-gray/50 border border-gray-800 rounded-xl p-6 text-lg placeholder-gray-600 focus:outline-none focus:border-sonic-accent focus:ring-1 focus:ring-sonic-accent transition-all resize-none"
                                placeholder="Type something here to synthesize..."
                            />
                        </div>

                        {/* Actions & Player */}
                        <div className="bg-sonic-gray/30 border border-gray-800 rounded-xl p-6 space-y-4">

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !text}
                                    className={`flex-[3] py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all duration-200 ${loading
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-sonic-accent text-black hover:bg-[#00DDAA] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] active:scale-[0.99]'
                                        }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            Synthesizing...
                                        </span>
                                    ) : (
                                        "Generate"
                                    )}
                                </button>

                                {audioSrc && (
                                    <button
                                        onClick={handleSave}
                                        className="flex-[1] py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all duration-200 bg-white text-black hover:bg-gray-200 active:scale-[0.99]"
                                    >
                                        Save
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg text-sm text-center">
                                    Error: {error}
                                </div>
                            )}

                            {/* Audio Visualizer / Player Area */}
                            <div className={`transition-all duration-500 overflow-hidden ${audioSrc ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="mt-2 bg-black/40 rounded-lg p-4 border border-gray-800">
                                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">Result</p>
                                    <audio
                                        ref={audioRef}
                                        controls
                                        src={audioSrc || ""}
                                        className="w-full h-10 accent-sonic-accent"
                                        style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                                    />
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
