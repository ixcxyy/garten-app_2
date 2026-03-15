'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PhotoUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: any) => void;
  onRemove?: () => void;
  className?: string;
  existingUrl?: string | null;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onUploadComplete,
  onUploadError,
  onRemove,
  className,
  existingUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(10); // Start with some progress

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `todo-photos/${fileName}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('garden-bucket')
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      setProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from('garden-bucket')
        .getPublicUrl(filePath);

      setTimeout(() => {
        setUploading(false);
        onUploadComplete(publicUrl);
      }, 500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image.');
      setUploading(false);
      setPreview(existingUrl || null);
      if (onUploadError) onUploadError(err);
    }
  }, [existingUrl, onUploadComplete, onUploadError]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    if (onRemove) onRemove();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("relative w-full", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />

      <motion.div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          isDragging 
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" 
            : "border-zinc-200 bg-zinc-50 hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/5",
          preview && !error ? "border-solid border-emerald-500/30" : "",
          error ? "border-red-500/50 bg-red-50 dark:bg-red-900/10" : ""
        )}
      >
        <AnimatePresence mode="wait">
          {preview && !error ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 h-full w-full"
            >
              <Image
                src={preview}
                alt="Preview"
                fill
                className={cn(
                  "object-cover transition-all duration-500",
                  uploading ? "scale-105 blur-[2px] opacity-70" : "group-hover:scale-105"
                )}
              />
              
              {!uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                      <Upload size={20} className="text-white" />
                    </div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Change Image</p>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <div className="relative flex items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-white" />
                    <span className="absolute text-[10px] font-bold text-white">{progress}%</span>
                  </div>
                  <div className="mt-4 w-32 overflow-hidden rounded-full bg-white/20">
                    <motion.div 
                      className="h-1 bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {!uploading && (
                <button
                  onClick={removeImage}
                  className="absolute top-3 right-3 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-md transition-transform hover:scale-110 hover:bg-red-500"
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-3 p-6 text-center"
            >
              <div className={cn(
                "rounded-full p-4 transition-colors",
                isDragging ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
              )}>
                <ImageIcon size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isDragging ? "Drop to upload" : "Drop your image here"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  or click to browse from your device
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800">PNG</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800">JPG</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800">MAX 10MB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-lg bg-red-500 p-2 text-xs font-medium text-white shadow-lg"
          >
            <AlertCircle size={14} />
            <span>{error}</span>
            <button onClick={(e) => { e.stopPropagation(); setError(null); }} className="ml-auto">
              <X size={14} />
            </button>
          </motion.div>
        )}

        {progress === 100 && !uploading && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 left-3 rounded-full bg-emerald-500 p-1 text-white shadow-lg"
          >
            <CheckCircle2 size={16} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
