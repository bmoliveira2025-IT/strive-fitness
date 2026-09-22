type PickerOptions = {
    allowsEditing?: boolean;
    aspect?: [number, number];
    mediaTypes?: unknown;
    quality?: number;
};

type PickerResult = {
    canceled: boolean;
    assets: { uri: string; fileName?: string; mimeType?: string }[];
};

export const MediaTypeOptions = { Images: 'images' } as const;

export async function requestCameraPermissionsAsync() {
    return { granted: true, status: 'granted' as const };
}

export async function requestMediaLibraryPermissionsAsync() {
    return { granted: true, status: 'granted' as const };
}

const MAX_IMAGE_EDGE = 1600;

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

async function optimizeImage(file: File, quality = 0.82): Promise<string> {
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        return readAsDataUrl(file);
    }

    const sourceUrl = URL.createObjectURL(file);
    try {
        const image = new window.Image();
        image.decoding = 'async';
        image.src = sourceUrl;
        await image.decode();

        const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return readAsDataUrl(file);

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', Math.min(0.92, Math.max(0.5, quality)));
    } finally {
        URL.revokeObjectURL(sourceUrl);
    }
}

function selectImage(options: PickerOptions, capture?: 'environment'): Promise<PickerResult> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (capture) input.setAttribute('capture', capture);

        let settled = false;
        const finish = (result: PickerResult) => {
            if (settled) return;
            settled = true;
            window.removeEventListener('focus', handleFocus);
            resolve(result);
        };
        const handleFocus = () => {
            window.setTimeout(() => {
                if (!input.files?.length) finish({ canceled: true, assets: [] });
            }, 400);
        };

        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) {
                finish({ canceled: true, assets: [] });
                return;
            }

            try {
                const uri = await optimizeImage(file, options.quality);
                finish({
                    canceled: false,
                    assets: [{ uri, fileName: file.name, mimeType: 'image/jpeg' }],
                });
            } catch {
                finish({ canceled: true, assets: [] });
            }
        }, { once: true });

        window.addEventListener('focus', handleFocus, { once: true });
        input.click();
    });
}

export async function launchCameraAsync(options: PickerOptions = {}) {
    return selectImage(options, 'environment');
}

export async function launchImageLibraryAsync(options: PickerOptions = {}) {
    return selectImage(options);
}
