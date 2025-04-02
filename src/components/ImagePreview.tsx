import { X } from "lucide-react";

export const ImagePreview = ({ previewImage, setPreviewImage }) => {
  if (!previewImage) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <button
          onClick={() => setPreviewImage(null)}
          className="absolute -top-4 -right-4 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <img
          src={previewImage}
          alt="Preview"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};
