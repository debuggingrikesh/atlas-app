'use client';

import { useState } from 'react';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

interface ProfileFormProps {
  initialFullName: string | null;
  initialAvatarUrl: string | null;
  email: string;
  roleName: string;
  businessName: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Ensure the compressed file is valid
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export function ProfileForm({ initialFullName, initialAvatarUrl, email, roleName, businessName }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialFullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState('saving');
    setErrorMsg(null);

    const payload: Record<string, string> = {};
    const trimmedName = fullName.trim();
    if (trimmedName) payload.fullName = trimmedName;

    if (file) {
      try {
        const compressedFile = await compressImage(file);
        
        if (compressedFile.size > 1024 * 1024) {
          setErrorMsg('Image is still too large after compression (must be under 1MB).');
          setSaveState('error');
          return;
        }

        const supabase = createClient();
        const fileName = `${Math.random().toString(36).substring(2)}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, compressedFile, {
             contentType: 'image/jpeg',
          });

        if (uploadError) {
          setErrorMsg('Failed to upload avatar. Please ensure the "avatars" bucket exists.');
          setSaveState('error');
          return;
        }
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        payload.avatarUrl = data.publicUrl;
      } catch (err) {
        console.error("Compression error:", err);
        setErrorMsg('Failed to process image before uploading.');
        setSaveState('error');
        return;
      }
    } else if (avatarUrl !== initialAvatarUrl) {
      payload.avatarUrl = avatarUrl;
    }

    if (Object.keys(payload).length === 0) {
      setErrorMsg('Please provide at least one field to update.');
      setSaveState('error');
      return;
    }

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        setErrorMsg(json.error?.message ?? 'Failed to save changes. Please try again.');
        setSaveState('error');
        return;
      }

      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setSaveState('error');
    }
  }

  const saving = saveState === 'saving';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Readonly Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Email</Label>
          <div className="text-sm font-medium">{email}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Business</Label>
          <div className="text-sm font-medium">{businessName}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Role</Label>
          <div className="text-sm font-medium">{roleName}</div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-medium tracking-tight">Edit Profile</h3>
        {/* Full name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            maxLength={100}
            placeholder="e.g. Rikesh Karmacharya"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Avatar Image Picker */}
        <div className="space-y-2">
          <Label htmlFor="avatarFile">Profile picture</Label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={avatarUrl} 
                alt="Avatar preview" 
                className="h-16 w-16 rounded-full object-cover border border-border" 
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted border border-border text-lg font-medium text-muted-foreground">
                {fullName.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 space-y-1">
              <Input
                id="avatarFile"
                name="avatarFile"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) {
                    setFile(selected);
                    setAvatarUrl(URL.createObjectURL(selected));
                  }
                }}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Max 1MB (automatically compressed). JPG, PNG, or WEBP.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error feedback */}
      {saveState === 'error' && errorMsg && (
        <p role="alert" className="text-sm text-red-500 bg-red-50 p-2 rounded-md border border-red-100">
          {errorMsg}
        </p>
      )}

      {/* Success feedback */}
      {saveState === 'saved' && (
        <p role="status" className="text-sm text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
          Profile saved successfully.
        </p>
      )}

      <div className="pt-2">
        <LoadingButton type="submit" disabled={saving} isLoading={saving} loadingText="Saving..." className="w-full sm:w-auto">
          Save changes
        </LoadingButton>
      </div>
    </form>
  );
}
