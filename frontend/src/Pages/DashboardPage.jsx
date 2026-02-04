import React, { useState, useRef, useEffect } from 'react';

function DashboardPage() {
  // ───── Patient Data (dummy) ─────
  const patient = {
    name: "Shivam Kumar",
    age: 22,
    gender: "Male",
    condition: "Type 2 Diabetes + Hypertension",
    lastVisit: "12 Jan 2026",
    outcomes: [
      { label: "HbA1c", value: "7.8%", status: "High" },
      { label: "Blood Pressure", value: "142/88 mmHg", status: "Elevated" },
      { label: "Weight", value: "78 kg", status: "Normal" },
      { label: "Blood Sugar (Fasting)", value: "148 mg/dL", status: "High" },
    ]
  };

  // ───── States ─────
  const [messages, setMessages] = useState([
    { role: "ai", content: "Namaste Rajesh ji! Aaj kaise feel kar rahe ho? Koi complaint hai?" },
  ]);
  const [input, setInput] = useState("");
  const [isRecordingMain, setIsRecordingMain] = useState(false);
  const [mainAudioURL, setMainAudioURL] = useState(null);
  const [mainTranscription, setMainTranscription] = useState("");
  const [isChatRecording, setIsChatRecording] = useState(false);

  const mainRecorderRef = useRef(null);
  const mainChunksRef = useRef([]);
  const chatRecorderRef = useRef(null);
  const chatChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // ───── Audio Recording Helpers ─────
  const startRecording = async (isMain = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        if (isMain) {
          setMainAudioURL(url);
          setMainTranscription("Transcription: Doctor saab, mujhe kal se bahut headache ho raha hai aur subah sugar 180 thi.");
        } else {
          setInput("Doctor saab, mujhe kal se bahut headache ho raha hai.");
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      if (isMain) {
        mainRecorderRef.current = recorder;
        mainChunksRef.current = chunks;
        setIsRecordingMain(true);
      } else {
        chatRecorderRef.current = recorder;
        chatChunksRef.current = chunks;
        setIsChatRecording(true);
      }
    } catch (err) {
      alert("Microphone access denied 😕");
    }
  };

  const stopRecording = (isMain = true) => {
    const recorder = isMain ? mainRecorderRef.current : chatRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      if (isMain) setIsRecordingMain(false);
      else setIsChatRecording(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const replies = [
        "Samajh gaya. Aapko fever bhi hai kya?",
        "Sugar level high lag raha hai. Aaj ka diet kya tha?",
        "Medicine continue rakho, 2 din baad check karte hain.",
        "Paani zyada piyo aur walk karo daily 30 min."
      ];
      const aiReply = { role: "ai", content: replies[Math.floor(Math.random() * replies.length)] };
      setMessages(prev => [...prev, aiReply]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col lg:flex-row">
      {/* ===================== LEFT: Patient Data ===================== */}
      <div className="w-full lg:w-96 bg-white border-r border-gray-200 p-6 overflow-auto shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white">
            👨🏻‍🦰
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{patient.name}</h2>
            <p className="text-gray-600">{patient.age} • {patient.gender}</p>
            <p className="text-sm text-blue-600 font-medium">{patient.condition}</p>
          </div>
        </div>

        <div className="mb-4 text-xs uppercase tracking-widest text-gray-500">Last Visit: {patient.lastVisit}</div>

        <div className="grid grid-cols-2 gap-4">
          {patient.outcomes.map((item, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <div className="text-xs text-gray-500 mb-1">{item.label}</div>
              <div className="text-3xl font-semibold mb-1">{item.value}</div>
              <div className={`text-xs px-3 py-1 rounded-full w-fit
                ${item.status === "High" || item.status === "Elevated" 
                  ? "bg-red-100 text-red-700" 
                  : "bg-green-100 text-green-700"}`}>
                {item.status}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-xs text-gray-500 font-medium">Medical History</div>
        <div className="mt-3 space-y-3 text-sm">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">• Diagnosed Diabetes in 2022</div>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">• BP medicine: Telmisartan 40mg</div>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">• Last ECG: Normal</div>
        </div>
      </div>

      {/* ===================== RIGHT SIDE ===================== */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">

        {/* ───── AUDIO CAPTURE SECTION ───── */}
        <div className="h-1/2 bg-white border-b border-gray-200 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-10">
            <div className="text-blue-600 text-sm tracking-widest mb-2 font-medium">LIVE CONSULTATION</div>
            <h3 className="text-4xl font-bold mb-1 text-gray-800">Patient Voice Capture</h3>
            <p className="text-gray-600">Record karo → AI automatically transcribe karega</p>
          </div>

          <div
            onClick={() => isRecordingMain ? stopRecording(true) : startRecording(true)}
            className={`w-40 h-40 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg
              ${isRecordingMain 
                ? 'bg-red-600 text-white shadow-red-300 animate-pulse' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'}`}
          >
            <div className="text-7xl drop-shadow-md">
              {isRecordingMain ? "⏹️" : "🎙️"}
            </div>
          </div>

          {isRecordingMain && (
            <div className="mt-6 text-red-600 font-mono text-xl flex items-center gap-2">
              <span className="animate-pulse">●</span> RECORDING... 00:12
            </div>
          )}

          {mainAudioURL && (
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-3xl p-6 w-full max-w-md">
              <audio controls src={mainAudioURL} className="w-full" />
              <div className="mt-4 text-sm text-green-600 font-medium">
                Transcription ready ✅
              </div>
              <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                {mainTranscription}
              </p>
            </div>
          )}
        </div>

        {/* ───── AI CHAT SECTION ───── */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-50">

          {/* Chat Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl text-white">
              🧠
            </div>
            <div>
              <div className="font-semibold text-gray-800">Dr. AI Assistant</div>
              <div className="text-green-600 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online • Hindi + English
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-5 py-3 rounded-3xl text-sm leading-relaxed shadow-sm
                    ${msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-3 bg-gray-100 rounded-3xl p-2 shadow-inner">
              {/* Voice Button */}
              <button
                onClick={() => isChatRecording ? stopRecording(false) : startRecording(false)}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all
                  ${isChatRecording 
                    ? "bg-red-500 text-white animate-pulse shadow-red-200" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                🎤
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type message or use voice..."
                className="flex-1 bg-transparent outline-none text-sm px-4 text-gray-800 placeholder-gray-500"
              />

              {/* Send Button */}
              <button
                onClick={sendMessage}
                className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 text-white"
              >
                ➤
              </button>
            </div>

            <div className="text-center text-xs text-gray-500 mt-3">
              AI suggestions will appear here • Powered by local model
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;