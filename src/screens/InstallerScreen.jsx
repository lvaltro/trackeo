import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save, Upload, ArrowLeft } from "lucide-react";

// Componente de pantalla para el Instalador
// Comentarios en Español, variables en inglés
const InstallerScreen = ({ onBack }) => {
  const navigate = useNavigate();
  // Si no recibe onBack (ej. entrada directa por URL), usa el router para volver al dashboard
  const handleBack = onBack ?? (() => navigate("/dashboard"));
  // Estado del formulario de datos básicos
  const [formData, setFormData] = useState({
    plate: "",
    mileage: "",
    imei: "",
  });

  // Estado de las fotos (archivo + URL de previsualización)
  const [photos, setPhotos] = useState({
    dashboard: { file: null, preview: null }, // Foto del tablero (odómetro)
    gps: { file: null, preview: null }, // Foto del GPS instalado
    vehicle: { file: null, preview: null }, // Foto del vehículo completo
  });

  // Manejar cambios en inputs de texto/número
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Manejar carga de fotos
  const handlePhotoChange = (key) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setPhotos((prev) => ({
      ...prev,
      [key]: {
        file,
        preview: previewUrl,
      },
    }));
  };

  // Envío del formulario (por ahora solo consola)
  const handleSubmit = (event) => {
    event.preventDefault();

    // Aquí luego vas a integrar con tu API / backend
    console.log("Installer validation payload:", {
      formData,
      photos,
    });

    // TODO: Reemplazar por lógica real de guardado (API Traccar / backend propio)
    alert("Datos de instalación listos para enviar (simulación).");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md px-4 py-6">
        {/* Header superior */}
        <header className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Validación de Instalación
            </h1>
            <p className="text-xs text-slate-500">
              Completa los datos y sube las evidencias para validar el trabajo.
            </p>
          </div>
        </header>

        {/* Tarjeta principal - diseño mobile-first */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Datos del vehículo */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Datos del vehículo
              </h2>

              {/* Patente */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">
                  Patente del Vehículo
                </label>
                <input
                  type="text"
                  value={formData.plate}
                  onChange={handleChange("plate")}
                  placeholder="Ej: ABCD-12"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base font-semibold tracking-wide uppercase text-slate-900 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Kilometraje */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">
                  Kilometraje Actual
                </label>
                <input
                  type="number"
                  value={formData.mileage}
                  onChange={handleChange("mileage")}
                  placeholder="Ej: 123456"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* IMEI */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">
                  IMEI del GPS
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.imei}
                    onChange={handleChange("imei")}
                    placeholder="Ej: 123456789012345"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {/* Futuro botón para escáner (código de barras / QR) */}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 active:scale-95 transition"
                    // TODO: Integrar escáner en el futuro (cámara / QR)
                  >
                    <Camera className="w-4 h-4 mr-1.5" />
                    Scan
                  </button>
                </div>
              </div>
            </section>

            {/* Evidencia fotográfica */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" />
                Evidencia fotográfica
              </h2>
              <p className="text-xs text-slate-500">
                Sube fotos claras. Máxima calidad posible. Verifica antes de
                guardar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Foto del Tablero */}
                <PhotoUploadCard
                  label="Tablero (Odómetro)"
                  description="Foto del odómetro"
                  photo={photos.dashboard}
                  onChange={handlePhotoChange("dashboard")}
                />

                {/* Foto del GPS instalado */}
                <PhotoUploadCard
                  label="GPS instalado"
                  description="Antes de cerrar"
                  photo={photos.gps}
                  onChange={handlePhotoChange("gps")}
                />

                {/* Foto del vehículo completo */}
                <PhotoUploadCard
                  label="Vehículo completo"
                  description="Lateral / 3/4"
                  photo={photos.vehicle}
                  onChange={handlePhotoChange("vehicle")}
                />
              </div>
            </section>

            {/* Botón de guardado */}
            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:bg-blue-800 active:scale-[0.99] transition"
              >
                <Save className="w-4 h-4" />
                Guardar validación de instalación
              </button>
            </div>
          </form>
        </div>

        {/* Nota inferior opcional */}
        <p className="mt-4 text-[11px] text-center text-slate-400">
          Trackeo Instalador · Verifica que todos los campos estén completos
          antes de entregar el vehículo.
        </p>
      </div>
    </div>
  );
};

// Subcomponente para cada bloque de subida de foto
const PhotoUploadCard = ({ label, description, photo, onChange }) => {
  const inputId = `photo-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <div>
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-500">{description}</p>
      </div>

      <label
        htmlFor={inputId}
        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-center text-xs text-slate-500 hover:bg-slate-50 active:scale-95 transition"
      >
        {photo?.preview ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={photo.preview}
              alt={label}
              className="h-20 w-full rounded-lg object-cover border border-slate-200"
            />
            <span className="text-[11px] font-medium text-emerald-600">
              Foto cargada · tocar para reemplazar
            </span>
          </div>
        ) : (
          <>
            <Camera className="w-6 h-6 text-slate-400" />
            <span className="font-medium text-slate-700">Subir foto</span>
            <span className="text-[10px] text-slate-400">
              Toca aquí para tomar o elegir desde la galería
            </span>
          </>
        )}
      </label>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
};

export default InstallerScreen;